// utils/gameLogic.js
/**
 * Рассчитывает количество опыта, необходимое для достижения следующего уровня.
 * Формула: floor(100 * (L ^ 1.5))
 * @param {number} level Текущий уровень.
 * @returns {number} Количество XP для следующего уровня.
 */
export const calculateXpForLevel = (level) => {
    if (!level || level < 1) return 100; // Защита от ошибок
    return Math.floor(100 * Math.pow(level, 1.5));
  };

  /**
 * Рассчитывает рекомендуемое количество повторений для упражнения.
 * Формула: floor(3 + (Уровень / 5) + (END / 10))
 * @param {number} level Уровень пользователя.
 * @param {number} statEnd Характеристика "Выносливость" (END).
 * @returns {number} Рекомендованное количество повторений.
 */
export const getRecommendedReps = (level, statEnd) => {
  if (!level || !statEnd) return 3; // Защита от ошибок
  return Math.floor(3 + (level / 5) + (statEnd / 10));
};