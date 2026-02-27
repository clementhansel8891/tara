const {PrismaClient}=require("@prisma/client"); const p=new PrismaClient(); console.log("client ok"); p.$disconnect();
