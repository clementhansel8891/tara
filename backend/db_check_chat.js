const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  try {
    const chatRooms = await prisma.chatRoom.count();
    const chatMessages = await prisma.chatMessage.count();
    const chatMembers = await prisma.chatMember.count();

    console.log(`Rooms: ${chatRooms}`);
    console.log(`Messages: ${chatMessages}`);
    console.log(`Members: ${chatMembers}`);

    if (chatRooms > 0) {
        const rooms = await prisma.chatRoom.findMany({
            take: 5,
            select: { id: true, name: true, type: true }
        });
        console.log("Rooms:", rooms);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
