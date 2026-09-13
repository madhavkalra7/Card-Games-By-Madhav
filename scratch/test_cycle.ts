import { BluffMasterRoom } from '../server/game/bluffEngine';

console.log('=== RUNNING COMPREHENSIVE BLUFF CYCLE & PASS TESTS ===\n');

// TEST 1: 2-player cycle test
{
  console.log('--- TEST 1: 2-Player game with contributor replay & sweep on pass ---');
  const room = new BluffMasterRoom('CYCLE_2P', () => {});
  const p1 = room.addPlayer({ id: 's1', sessionId: 'sess1', name: 'Alice', avatarColor: '#e11d48' });
  const p2 = room.addPlayer({ id: 's2', sessionId: 'sess2', name: 'Bob', avatarColor: '#2563eb' });
  room.startGame();

  // Alice leads with 2 cards as 'Q'
  const c1 = p1.cards[0];
  const c2 = p1.cards[1];
  const play1 = room.playCards(p1.id, [c1.id, c2.id], 'Q');
  console.log(`1. Alice plays 2 cards as 'Q': success=${play1.success}`);
  console.log(`   Active turn: ${room.getActivePlayer()?.name}, Pile: ${room.centerPile.length}, Claim: ${room.currentDeclaredRank}`);
  if (room.getActivePlayer()?.id !== p2.id) throw new Error('Expected Bob to have turn');

  // Bob passes
  const pass1 = room.passTurn(p2.id);
  console.log(`2. Bob passes: success=${pass1.success}`);
  console.log(`   Active turn: ${room.getActivePlayer()?.name}, Pile: ${room.centerPile.length}, Claim: ${room.currentDeclaredRank}`);

  // CRITICAL CHECK: Turn must be back to Alice! Pile must NOT be swept yet!
  if (room.getActivePlayer()?.id !== p1.id) throw new Error(`Expected Alice to have turn, got ${room.getActivePlayer()?.name}`);
  if ((room.centerPile.length as number) !== 2) throw new Error(`Expected center pile to still have 2 cards, got ${room.centerPile.length}`);
  if (room.currentDeclaredRank !== 'Q') throw new Error(`Expected claim 'Q', got ${room.currentDeclaredRank}`);
  console.log('   ✓ Verified: Pile NOT swept! Alice received turn back with claim "Q" active!');

  // Alice plays 1 more card of 'Q'
  const c3 = p1.cards[0];
  const play2 = room.playCards(p1.id, [c3.id], 'Q');
  console.log(`3. Alice plays 1 MORE card as 'Q': success=${play2.success}`);
  console.log(`   Active turn: ${room.getActivePlayer()?.name}, Pile: ${room.centerPile.length}`);
  if (room.getActivePlayer()?.id !== p2.id) throw new Error('Expected Bob to have turn');
  if (room.centerPile.length !== 3) throw new Error('Expected 3 cards in pile');

  // Bob passes again
  room.passTurn(p2.id);
  console.log(`4. Bob passes again -> Active turn: ${room.getActivePlayer()?.name}`);
  if (room.getActivePlayer()?.id !== p1.id) throw new Error('Expected Alice to have turn');

  // Now Alice chooses to PASS
  const passAlice = room.passTurn(p1.id);
  console.log(`5. Alice passes: success=${passAlice.success}`);
  console.log(`   Active turn: ${room.getActivePlayer()?.name}, Pile: ${room.centerPile.length}, Claim: ${room.currentDeclaredRank}`);

  // CRITICAL CHECK: Now pile must be swept (0 cards), and Alice leads fresh cycle (claim = null)!
  if ((room.centerPile.length as number) !== 0) throw new Error(`Expected pile swept (0 cards), got ${room.centerPile.length}`);
  if (room.currentDeclaredRank !== null) throw new Error(`Expected fresh cycle (claim null), got ${room.currentDeclaredRank}`);
  if (room.getActivePlayer()?.id !== p1.id) throw new Error(`Expected Alice to lead fresh cycle, got ${room.getActivePlayer()?.name}`);
  console.log('   ✓ Verified: Alice passed -> Pile swept! Alice leads fresh cycle!\n');
}

// TEST 2: 3-player game with multiple contributors
{
  console.log('--- TEST 2: 3-Player game with contributor change and sweep ---');
  const room = new BluffMasterRoom('CYCLE_3P', () => {});
  const p1 = room.addPlayer({ id: 's1', sessionId: 'sess1', name: 'Alice', avatarColor: '#e11d48' });
  const p2 = room.addPlayer({ id: 's2', sessionId: 'sess2', name: 'Bob', avatarColor: '#2563eb' });
  const p3 = room.addPlayer({ id: 's3', sessionId: 'sess3', name: 'Charlie', avatarColor: '#059669' });
  room.startGame();

  // Alice plays 2 cards as 'K'
  room.playCards(p1.id, [p1.cards[0].id, p1.cards[1].id], 'K');
  console.log(`1. Alice plays 2 as 'K' (Pile: ${room.centerPile.length})`);

  // Bob adds 1 card as 'K' (Bob is now the latest contributor!)
  room.playCards(p2.id, [p2.cards[0].id], 'K');
  console.log(`2. Bob plays 1 as 'K' (Pile: ${room.centerPile.length}, Latest: ${room.latestPlayerName})`);

  // Charlie passes
  room.passTurn(p3.id);
  console.log(`3. Charlie passes -> Turn: ${room.getActivePlayer()?.name}`);

  // Alice passes
  room.passTurn(p1.id);
  console.log(`4. Alice passes -> Turn: ${room.getActivePlayer()?.name}`);

  // CRITICAL CHECK: Turn must return to Bob (the latest contributor)!
  if (room.getActivePlayer()?.id !== p2.id) throw new Error(`Expected Bob, got ${room.getActivePlayer()?.name}`);
  if ((room.centerPile.length as number) !== 3) throw new Error('Expected 3 cards in pile');
  if (room.currentDeclaredRank !== 'K') throw new Error('Expected claim K');
  console.log('   ✓ Verified: Pile NOT swept! Bob (latest contributor) gets turn back!');

  // Bob passes
  room.passTurn(p2.id);
  console.log(`5. Bob passes -> Pile: ${room.centerPile.length}, Claim: ${room.currentDeclaredRank}, Turn: ${room.getActivePlayer()?.name}`);

  // CRITICAL CHECK: Pile swept, Bob leads fresh cycle!
  if ((room.centerPile.length as number) !== 0) throw new Error('Expected pile swept');
  if (room.currentDeclaredRank !== null) throw new Error('Expected fresh cycle');
  if (room.getActivePlayer()?.id !== p2.id) throw new Error('Expected Bob to lead fresh cycle');
  console.log('   ✓ Verified: Bob passed -> Pile swept! Bob leads fresh cycle!\n');
}

console.log('🎉 ALL BLUFF CYCLE TESTS PASSED PERFECTLY!');
