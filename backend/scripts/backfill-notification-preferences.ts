import { PrismaClient, NotificationChannel } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const MODULES = [
  'HR',
  'FINANCE',
  'IT',
  'PROCUREMENT',
  'SALES',
  'RETAIL',
  'INVENTORY',
  'MARKETING',
  'COMMS',
  'PROJECT'
];

const CHANNELS: NotificationChannel[] = [
  NotificationChannel.IN_APP,
  NotificationChannel.EMAIL,
  NotificationChannel.PUSH
];

async function main() {
  console.log('🚀 Starting notification preferences backfill...');

  const users = await prisma.user.findMany({
    include: {
      userCompanies: true,
    },
  });

  console.log(`🔍 Found ${users.length} users to process.`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    if (user.userCompanies.length === 0) {
      console.log(`⚠️ User ${user.email} (${user.id}) has no associated companies. Skipping.`);
      continue;
    }

    for (const userCompany of user.userCompanies) {
      const tenantId = userCompany.tenantId;

      for (const module of MODULES) {
        for (const channel of CHANNELS) {
          // Default event type is 'ALL'
          const eventType = 'ALL';

          const enabled = channel === NotificationChannel.PUSH ? false : true;

          try {
            const existing = await prisma.userNotificationPreference.findUnique({
              where: {
                tenantId_userId_module_eventType_channel: {
                  tenantId,
                  userId: user.id,
                  module,
                  eventType,
                  channel,
                },
              },
            });

            if (!existing) {
              await prisma.userNotificationPreference.create({
                data: {
                  tenantId,
                  userId: user.id,
                  module,
                  eventType,
                  channel,
                  enabled,
                },
              });
              createdCount++;
            } else {
              skippedCount++;
            }
          } catch (error) {
            console.error(`❌ Error processing preference for user ${user.email}, module ${module}, channel ${channel}:`, error);
          }
        }
      }
    }
  }

  console.log('\n✅ Backfill complete!');
  console.log(`   Created: ${createdCount}`);
  console.log(`   Skipped: ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error('💥 Fatal error in backfill script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
