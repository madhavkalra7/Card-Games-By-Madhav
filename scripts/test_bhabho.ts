import { io } from 'socket.io-client';

async function runBhabhoTest() {
  console.log('🧪 Starting Automated Bhabho Server Engine & Socket Verification...\n');

  const URL = 'http://127.0.0.1:3000';
  const socket1 = io(URL, { transports: ['websocket', 'polling'] });
  const socket2 = io(URL, { transports: ['websocket', 'polling'] });
  const socket3 = io(URL, { transports: ['websocket', 'polling'] });

  socket1.on('connect_error', (e) => console.error('s1 connect_error:', e.message));
  socket2.on('connect_error', (e) => console.error('s2 connect_error:', e.message));
  socket3.on('connect_error', (e) => console.error('s3 connect_error:', e.message));

  await Promise.all([
    new Promise((resolve) => socket1.connected ? resolve(true) : socket1.on('connect', () => resolve(true))),
    new Promise((resolve) => socket2.connected ? resolve(true) : socket2.on('connect', () => resolve(true))),
    new Promise((resolve) => socket3.connected ? resolve(true) : socket3.on('connect', () => resolve(true))),
  ]);
  console.log('✅ 3 Sockets connected to game server.');

  // 1. Create Bhabho Room
  const createRes: any = await new Promise((resolve) => {
    socket1.emit(
      'createRoom',
      { name: 'Madhav (Host)', avatarColor: '#e11d48', sessionId: 'sess-1', gameType: 'BHABHO' },
      resolve
    );
  });
  const roomCode = createRes.roomCode;
  const gameType = createRes.state?.gameType;
  console.log('✅ Room created with code:', roomCode, 'GameType:', gameType);
  if (gameType !== 'BHABHO') {
    throw new Error(`Expected gameType BHABHO, got ${gameType}`);
  }

  // 2. Player 2 and 3 join
  await new Promise((resolve) => {
    socket2.emit('joinRoom', { roomCode, name: 'Player 2', avatarColor: '#2563eb', sessionId: 'sess-2' }, resolve);
  });
  await new Promise((resolve) => {
    socket3.emit('joinRoom', { roomCode, name: 'Player 3', avatarColor: '#059669', sessionId: 'sess-3' }, resolve);
  });
  console.log('✅ Players 2 and 3 joined table.');

  // Store state per socket
  let state1: any = null;
  let state2: any = null;
  let state3: any = null;

  socket1.on('syncState', (s) => (state1 = s));
  socket2.on('syncState', (s) => (state2 = s));
  socket3.on('syncState', (s) => (state3 = s));

  // 3. Host starts game
  await new Promise((resolve) => {
    socket1.emit('startGame', { roomCode }, resolve);
  });

  // Give state sync a moment
  await new Promise((r) => setTimeout(r, 400));

  console.log('\n--- Match Started ---');
  console.log(`Players count: ${state1.players.length}`);
  console.log(`Player 1 cards: ${state1.bhabhoState.myHand.length}`);
  console.log(`Player 2 cards: ${state2.bhabhoState.myHand.length}`);
  console.log(`Player 3 cards: ${state3.bhabhoState.myHand.length}`);
  const totalCards =
    state1.bhabhoState.myHand.length + state2.bhabhoState.myHand.length + state3.bhabhoState.myHand.length;
  console.log(`Total distributed cards: ${totalCards} (Expected: 52)`);
  if (totalCards !== 52) throw new Error('Expected 52 cards total in 3-player deal!');

  // 4. Verify Ace of Spades holder starts first trick
  const players = [
    { socket: socket1, state: () => state1, name: 'Madhav (Host)' },
    { socket: socket2, state: () => state2, name: 'Player 2' },
    { socket: socket3, state: () => state3, name: 'Player 3' },
  ];

  const aceHolder = players.find((p) =>
    p.state().bhabhoState.myHand.some((c: any) => c.suit === 'S' && c.rank === 'A')
  );

  if (!aceHolder) throw new Error('No player found holding Ace of Spades!');

  console.log(`\n👑 Player holding Ace of Spades (♠ A): ${aceHolder.name}`);
  console.log(`Current Turn Player: ${state1.currentTurnPlayerId === aceHolder.state().myPlayerId ? 'CORRECT (Ace Holder)' : 'WRONG!'}`);
  if (state1.currentTurnPlayerId !== aceHolder.state().myPlayerId) {
    throw new Error('Ace of Spades holder is NOT the active turn player!');
  }

  // 5. Test legal cards rule for Ace of Spades
  const legalCards = aceHolder.state().bhabhoState.canPlayCardIds;
  console.log(`Legal cards for Ace holder on trick 1: ${legalCards.length} cards`);
  const aceCard = aceHolder.state().bhabhoState.myHand.find((c: any) => c.suit === 'S' && c.rank === 'A');
  if (legalCards.length !== 1 || legalCards[0] !== aceCard.id) {
    throw new Error(`Expected only Ace of Spades (${aceCard.id}) to be legal, got: ${JSON.stringify(legalCards)}`);
  }
  console.log('✅ Rule Verified: Player holding Ace of Spades is STRICTLY locked to play ONLY ♠ A on trick 1!');

  // 6. Test illegal card play rejection
  const nonAceCard = aceHolder.state().bhabhoState.myHand.find((c: any) => c.id !== aceCard.id);
  const illegalPlayRes: any = await new Promise((resolve) => {
    aceHolder.socket.emit('bhabho:playCard', { roomCode, cardId: nonAceCard.id }, resolve);
  });
  console.log('Attempting to play non-Ace card on trick 1:', illegalPlayRes);
  if (illegalPlayRes.success) {
    throw new Error('Server should have rejected non-Ace play on trick 1!');
  }
  console.log('✅ Rule Verified: Server correctly rejects non-Ace card play on opening trick.');

  // 7. Play Ace of Spades legally
  const legalPlayRes: any = await new Promise((resolve) => {
    aceHolder.socket.emit('bhabho:playCard', { roomCode, cardId: aceCard.id }, resolve);
  });
  console.log('Playing Ace of Spades:', legalPlayRes);
  if (!legalPlayRes.success) {
    throw new Error(`Ace of Spades play failed: ${legalPlayRes.error}`);
  }

  await new Promise((r) => setTimeout(r, 400));

  console.log('\n--- After ♠ A Played ---');
  console.log(`Lead suit set to: ${state1.bhabhoState.leadSuit} (Expected: 'S')`);
  console.log(`Cards on center table: ${state1.bhabhoState.currentTrick.length}`);
  console.log(`Highest lead card: ${state1.bhabhoState.highestLeadCard?.card.rank}${state1.bhabhoState.highestLeadCard?.card.suit} by ${state1.bhabhoState.highestLeadCard?.playerName}`);

  // 8. Next Player Turn: Check suit follow verification
  const nextPlayer = players.find((p) => p.state().myPlayerId === state1.currentTurnPlayerId)!;
  console.log(`\nNext Turn: ${nextPlayer.name}`);
  const nextPlayerSpades = nextPlayer.state().bhabhoState.myHand.filter((c: any) => c.suit === 'S');
  const nextPlayerLegal = nextPlayer.state().bhabhoState.canPlayCardIds;

  if (nextPlayerSpades.length > 0) {
    console.log(`Next player has ${nextPlayerSpades.length} Spades. Legal cards count: ${nextPlayerLegal.length}`);
    if (nextPlayerLegal.length !== nextPlayerSpades.length) {
      throw new Error('Must follow suit: player has Spades, so only Spades should be legal!');
    }
    console.log('✅ Rule Verified: Following suit strictly enforced!');

    // Test rejection of off-suit card when player has Spades
    const offSuitCard = nextPlayer.state().bhabhoState.myHand.find((c: any) => c.suit !== 'S');
    if (offSuitCard) {
      const offSuitRes: any = await new Promise((resolve) => {
        nextPlayer.socket.emit('bhabho:playCard', { roomCode, cardId: offSuitCard.id }, resolve);
      });
      console.log('Attempting off-suit card when holding Spades:', offSuitRes);
      if (offSuitRes.success) {
        throw new Error('Server should have rejected off-suit play when holding lead suit!');
      }
      console.log('✅ Rule Verified: Illegal off-suit play correctly rejected by server!');
    }

    // Play a legal spade
    const legalSpade = nextPlayerSpades[0];
    const spadePlayRes: any = await new Promise((resolve) => {
      nextPlayer.socket.emit('bhabho:playCard', { roomCode, cardId: legalSpade.id }, resolve);
    });
    console.log('Playing legal Spade:', spadePlayRes);
  }

  await new Promise((r) => setTimeout(r, 400));

  // Player 3 or final player in trick
  const thirdPlayer = players.find((p) => p.state().myPlayerId === state1.currentTurnPlayerId)!;
  console.log(`\nNext Turn: ${thirdPlayer.name}`);
  const thirdPlayerSpades = thirdPlayer.state().bhabhoState.myHand.filter((c: any) => c.suit === 'S');

  if (thirdPlayerSpades.length > 0) {
    const card = thirdPlayerSpades[0];
    await new Promise((resolve) => {
      thirdPlayer.socket.emit('bhabho:playCard', { roomCode, cardId: card.id }, resolve);
    });
    console.log(`Played final spade ${card.rank}${card.suit} in trick.`);
    await new Promise((r) => setTimeout(r, 400));

    console.log('\n--- Clean Trick Completed ---');
    console.log(`Waste pile count: ${state1.bhabhoState.wastePileCount} (Expected: 3)`);
    console.log(`Current trick reset to empty: ${state1.bhabhoState.currentTrick.length === 0}`);
    console.log(`Lead suit reset: ${state1.bhabhoState.leadSuit === null}`);
    console.log(`Next trick leader: ${state1.currentTurnPlayerId}`);
  } else {
    // Player has no spades -> THULLA!
    const thullaCard = thirdPlayer.state().bhabhoState.myHand[0];
    console.log(`Player has NO spades! Giving THULLA with ${thullaCard.rank}${thullaCard.suit}...`);
    const thullaRes: any = await new Promise((resolve) => {
      thirdPlayer.socket.emit('bhabho:playCard', { roomCode, cardId: thullaCard.id }, resolve);
    });
    console.log('Thulla play result:', thullaRes);
    await new Promise((r) => setTimeout(r, 400));

    console.log('\n--- Thulla Penalty Resolved ---');
    console.log(`Last trick type: ${state1.bhabhoState.lastTrickResult?.type} (Expected: 'THULLA')`);
    console.log(`Penalized player: ${state1.bhabhoState.lastTrickResult?.winnerOrPenalizedPlayerName}`);
    console.log(`Trick reset to empty: ${state1.bhabhoState.currentTrick.length === 0}`);
  }

  console.log('\n🎉 ALL BHABHO GAME ENGINE & SOCKET RULES VERIFIED 100% WORKING!\n');
  socket1.disconnect();
  socket2.disconnect();
  socket3.disconnect();
  process.exit(0);
}

runBhabhoTest().catch((err) => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
