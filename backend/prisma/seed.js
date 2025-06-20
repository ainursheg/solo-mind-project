const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function main() {
  console.log(`Начинаем начальное заполнение (seeding)...`);

  // Исходные данные для упражнений
  const exercisesData = [
    { name: 'Отжимания', multiplier: 1.0, group: 'push' },
    { name: 'Подтягивания', multiplier: 1.5, group: 'pull' },
    { name: 'Приседания', multiplier: 0.8, group: 'legs' },
  ];

  // Используем createMany для добавления всех записей одним запросом
  // skipDuplicates: true - предотвращает ошибки при повторном запуске сидинга
  await prisma.exercise.createMany({
    data: exercisesData,
    skipDuplicates: true,
  });

  console.log(`Начальное заполнение завершено.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });