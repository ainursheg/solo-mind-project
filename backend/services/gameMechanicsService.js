// services/gameMechanicsService.js

/**
 * Рассчитывает количество опыта, необходимое для достижения следующего уровня.
 * Формула: floor(100 * (L ^ 1.5))
 * @param {number} level Текущий уровень.
 * @returns {number} Количество XP для следующего уровня.
 */
function calculateXpForLevel(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
  }
  
  /**
   * Рассчитывает рекомендуемое количество повторений для упражнения.
   * Формула: floor(3 + (Уровень / 5) + (END / 10))
   * @param {number} level Уровень пользователя.
   * @param {number} statEnd Характеристика "Выносливость" (END).
   * @returns {number} Рекомендованное количество повторений.
   */
  function getRecommendedReps(level, statEnd) {
    return Math.floor(3 + (level / 5) + (statEnd / 10));
  }
 /**
 * Рассчитывает "Единый Опыт" (Unity XP), получаемый за выполнение упражнения.
 * Формула: (EV_Body * 3) * (1 + (STR + WIS) / 200)
 * @param {number} evBody "Усилие тела" (Сделано_Повторений * Множитель_Упражнения).
 * @param {object} profile Объект профиля пользователя.
 * @param {number} profile.statStr Сила (STR).
 * @param {number} profile.statWis Мудрость (WIS).
 * @returns {number} Количество очков опыта.
 */
function calculateUnityXp(evBody, profile) {
  // v7.0 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ: Используем правильные имена полей 'statStr' и 'statWis'
  const xp = (evBody * 3) * (1 + ((profile.statStr || 1) + (profile.statWis || 1)) / 200);
  return Math.floor(xp);
}
  
  /**
   * Проверяет и рассчитывает новые значения характеристик на основе накопленных "усилий".
   * @param {object} user Объект пользователя из БД, содержащий total-поля.
   * @returns {object} Объект с новыми значениями характеристик { statStr, statEnd, statInt, statWis }.
   */
  function calculateNewStats(user) {
      // v7.0: Базовое значение статов равно 1.
      const baseStatValue = 1;
  
      // INT: +1 за каждые 1000 totalMindEffort.
      const newInt = baseStatValue + Math.floor((user.totalMindEffort || 0) / 1000);
  
      // WIS: +1 за каждые 20 пройденных квизов.
      const newWis = baseStatValue + Math.floor((user.quizzesPassed || 0) / 20);
  
      // STR: +1 за каждые 1000 totalBodyEffort.
      const newStr = baseStatValue + Math.floor((user.totalBodyEffort || 0) / 1000);
  
      // END: +1 за каждые 50 выполненных подходов.
      const newEnd = baseStatValue + Math.floor((user.approachesCompleted || 0) / 50);
  
      return {
          statStr: newStr,
          statEnd: newEnd,
          statInt: newInt,
          statWis: newWis,
      };
  }
  
  
  // Экспортируем все функции, чтобы их можно было использовать в других файлах (например, в index.js)
  module.exports = {
    calculateXpForLevel,
    getRecommendedReps,
    calculateUnityXp,
    calculateNewStats,
  };