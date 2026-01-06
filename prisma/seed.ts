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

  const consultationTypes = [
    { 
      name: 'Consulta Geral', 
      price: 150.00, 
      description: 'Atendimento clínico geral para avaliação de rotina.',
      duration: 30
    },
    { 
      name: 'Consulta Especializada', 
      price: 250.00, 
      description: 'Atendimento com especialista focado em queixas específicas.',
      duration: 45
    },
    { 
      name: 'Retorno', 
      price: 100.00, 
      description: 'Reavaliação de exames e acompanhamento de tratamento.',
      duration: 20
    }
  ]

  for (const type of consultationTypes) {

    const exists = await prisma.consultationType.findFirst({
        where: { name: type.name }
    });

    if (!exists) {
        await prisma.consultationType.create({
            data: {
                name: type.name,
                price: type.price,
                description: type.description,
                duration: type.duration
            }
        });
    }
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