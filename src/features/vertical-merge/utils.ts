/**
 * Очищает имя файла от расширения и суффиксов
 * @param fileName - имя файла для очистки
 * @returns очищенное имя файла
 */
export const cleanFileName = (fileName: string): string => {
  // Удаляем расширение файла
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  
  // Удаляем суффикс _merged и любые номера в скобках после него
  const cleanedName = nameWithoutExt.replace(/_merged(?:\s*\(\d+\))?/g, '');
  
  // Удаляем лишние пробелы
  return cleanedName.trim();
}; 