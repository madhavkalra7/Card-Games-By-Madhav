import { BhabhoRoom } from '../server/game/bhabhoEngine';

async function verifyBhabhoGameOver() {
  console.log('🧪 Verifying Bhabho Game Over Leaderboard, Scores, Coins & Reward Card Drop...\n');

  let stateUpdatesCount = 0;
  let gameOverEmitted = false;

  const room = new BhabhoRoom(
    'TEST01',
    () => {
      stateUpdatesCount++;
    },
    (finishedRoom) => {
      gameOverEmitted = true;
      console.log('✅ onGameOver callback triggered successfully!');
    }
  );

  // 1. Add 3 players
  const p1 = room.addPlayer({ id: 'sock-1', sessionId: 'sess-1', name: 'Madhav (Winner)', avatarColor: '#e11d48' });
  const p2 = room.addPlayer({ id: 'sock-2', sessionId: 'sess-2', name: 'Rahul (Runner-Up)', avatarColor: '#2563eb' });
  const p3 = room.addPlayer({ id: 'sock-3', sessionId: 'sess-3', name: 'Kabir (The Bhabho)', avatarColor: '#059669' });

  // 2. Start game
  const startRes = room.startGame();
  console.log('Game started:', startRes);

  // 3. Simulate gameplay where p1 empties their hand first (Escape #1)
  p1.cards = [];
  (room as any).checkPlayerEscape(p1);
  console.log(`Player 1 Escaped status: ${p1.isFinished}, Rank: #${p1.rank}`);
  if (p1.rank !== 1) throw new Error(`Expected p1 rank 1, got ${p1.rank}`);

  // 4. Simulate p2 emptying their hand second (Escape #2)
  p2.cards = [];
  (room as any).checkPlayerEscape(p2);
  console.log(`Player 2 Escaped status: ${p2.isFinished}, Rank: #${p2.rank}`);
  if (p2.rank !== 2) throw new Error(`Expected p2 rank 2, got ${p2.rank}`);

  // 5. p3 still holds cards -> Check Game Over
  const isGameOver = (room as any).checkGameOver();
  console.log('Check game over result:', isGameOver);
  if (!isGameOver) throw new Error('Expected checkGameOver to return true!');

  console.log('\n--- Leaderboard & Rankings Verification ---');
  console.log(`Room Status: ${room.status} (Expected: GAME_OVER)`);
  console.log(`Winner: ${room.winner?.name} (${room.winner?.id})`);
  if (room.winner?.id !== p1.id) throw new Error(`Expected winner to be ${p1.name}`);

  console.log('\nStandings:');
  for (const r of room.rankings) {
    console.log(`Rank #${r.rank}: ${r.name}`);
    console.log(`  - Score: +${r.scoreEarned} PTS`);
    console.log(`  - Coins: +${r.coinsEarned} Coins`);
    if (r.rewardCard) {
      console.log(`  - 🎁 Reward Card Drop: ${r.rewardCard.name} (${r.rewardCard.hindiName}) [${r.rewardCard.rarity.toUpperCase()}]`);
      console.log(`    Collector #: #${r.rewardCard.collectorNumber}, Power: ${r.rewardCard.power}`);
    } else {
      console.log(`  - No card drop`);
    }
  }

  // Validations:
  const rank1 = room.rankings.find((r) => r.rank === 1)!;
  const rank2 = room.rankings.find((r) => r.rank === 2)!;
  const bhabho = room.rankings.find((r) => r.rank === 3)!;

  if ((rank1.scoreEarned ?? 0) <= 0) throw new Error('Winner must earn > 0 score points!');
  if ((rank1.coinsEarned ?? 0) <= 0) throw new Error('Winner must earn > 0 coins!');
  if (!rank1.rewardCard) throw new Error('Winner must receive a collectible reward card!');
  if (!rank1.rewardCard.name || !rank1.rewardCard.id) throw new Error('Reward card missing metadata!');

  if ((rank2.scoreEarned ?? 0) <= 0) throw new Error('Runner up must earn > 0 score points!');
  if ((rank2.coinsEarned ?? 0) <= 0) throw new Error('Runner up must earn > 0 coins!');
  if (!rank2.rewardCard) throw new Error('Runner up must receive a collectible reward card!');

  if ((bhabho.scoreEarned ?? 0) !== 0) throw new Error('The Bhabho loser must earn 0 score points!');
  if ((bhabho.coinsEarned ?? 0) !== 0) throw new Error('The Bhabho loser must earn 0 coins!');
  if (bhabho.rewardCard) throw new Error('The Bhabho loser must NOT receive a reward card!');

  // Check client view
  const clientView = room.getClientView(p1.id);
  console.log('\n--- Client View Verification ---');
  console.log(`Client View Winner: ${clientView.winner?.name}`);
  console.log(`Client View Rankings length: ${clientView.rankings?.length}`);
  console.log(`My Player ID received: ${clientView.myPlayerId}`);
  if (!clientView.winner || !clientView.rankings || clientView.rankings.length !== 3) {
    throw new Error('Client view missing winner or rankings!');
  }

  console.log('\n🎉 ALL GAME OVER LEADERBOARD, SCORES, COINS & CARD DROPS 100% VERIFIED!\n');
}

verifyBhabhoGameOver().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
