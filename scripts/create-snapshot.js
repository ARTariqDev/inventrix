/**
 * Manual Snapshot Creation Script
 * 
 * This script allows you to manually create monthly snapshots for any past month.
 * Useful for:
 * - Initial setup when implementing the snapshot system
 * - Creating snapshots for previous months
 * - Testing the snapshot functionality
 * 
 * Usage:
 * 1. Make sure your development server is running (npm run dev)
 * 2. Update the userId, year, and month variables below
 * 3. Run: node scripts/create-snapshot.js
 */

const userId = "YOUR_USER_ID_HERE"; // Replace with actual MongoDB user ID
const year = 2024;
const month = 10; // October

async function createSnapshot() {
  try {
    console.log(`🔄 Creating snapshot for ${year}-${String(month).padStart(2, '0')}...`);
    
    const response = await fetch('http://localhost:3000/api/stats/snapshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `userId=${userId}` // This is a simplified approach
      },
      body: JSON.stringify({ year, month })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success:', data.message);
      console.log('📊 Snapshot data:', JSON.stringify(data.snapshot, null, 2));
    } else {
      const error = await response.json();
      console.error('❌ Error:', error.error);
    }
  } catch (error) {
    console.error('❌ Failed to create snapshot:', error);
  }
}

createSnapshot();
