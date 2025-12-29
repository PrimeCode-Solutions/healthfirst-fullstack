import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient()

async function main() {
  const categories = [
    { name: 'Nutrição', description: 'Materiais focados em alimentação e dietas.' },
    { name: 'Pediatria', description: 'Guias sobre saúde infantil e desenvolvimento.' },
    { name: 'Introdução Alimentar', description: 'Conteúdo para as primeiras fases da alimentação do bebê.' },
    { name: 'Geral', description: 'Materiais informativos gerais de saúde.' }
  ]

  for (const category of categories) {
    await prisma.ebookCategory.upsert({
      where: { name: category.name },
      update: {},
      create: {
        name: category.name,
        description: category.description,
      },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })