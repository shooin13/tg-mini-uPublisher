import { Telegraf, Markup } from 'telegraf';
import axios from 'axios';

const token = '7266273164:AAEpqPG-BojdCgrTeQJ5f15PA-VXAJfr-aY';
const bot = new Telegraf(token);

const webAppUrl = 'https://upublisher-281ca.web.app'; // URL вашего мини-приложения

const userMessageIds = {}; // Словарь для хранения идентификаторов сообщений пользователей

bot.start((ctx) => {
  console.log('Бот получил команду /start');
  ctx.reply('Добро пожаловать! Введите ваш API ключ:');
});

// Обработчик текстовых сообщений от пользователя
bot.on('text', async (ctx) => {
  const apiKey = ctx.message.text.trim(); // Получаем API ключ из текста сообщения

  if (!apiKey) {
    console.log('API ключ отсутствует');
    return ctx.reply('API ключ отсутствует. Пожалуйста, введите ключ.');
  }

  console.log('Получен API ключ:', apiKey);

  // Формируем URL для мини-приложения с API ключом
  const appUrlWithApiKey = `${webAppUrl}?apiKey=${encodeURIComponent(apiKey)}`;

  const sentMessage = await ctx.reply(
    'Теперь вы можете пользоваться приложением!',
    Markup.inlineKeyboard([
      Markup.button.webApp('Открыть приложение', appUrlWithApiKey)
    ])
  );

  // Сохраняем идентификатор сообщения
  userMessageIds[ctx.from.id] = sentMessage.message_id;
  console.log(`Сообщение с ID ${sentMessage.message_id} сохранено для пользователя ${ctx.from.id}`);
});

// Обработчик для получения данных от WebApp
bot.on('web_app_data', async (ctx) => {
  console.log('Получены данные от WebApp:', ctx.update.message.web_app_data.data);

  const data = JSON.parse(ctx.update.message.web_app_data.data);
  const apiKey = data.apiKey;

  if (!apiKey) {
    console.log('API ключ отсутствует');
    return ctx.reply('API ключ отсутствует. Пожалуйста, введите ключ.');
  }

  try {
    console.log('Отправка запроса к API с ключом:', apiKey);
    const response = await axios.get('https://jsonplaceholder.typicode.com/todos/1', {
      headers: {
        Authorization: `ApiKey ${apiKey}`
      }
    });
    console.log('Ответ от API получен:', response.data);
    ctx.reply(`Отчет получен: ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.error('Ошибка выполнения запроса к API:', error);
    ctx.reply('Ошибка выполнения запроса к API');
  }
});

// Обработчик удаления устаревшего сообщения
bot.on('web_app_data', async (ctx) => {
  const data = JSON.parse(ctx.update.message.web_app_data.data);
  if (data === 'requestNewApiKey') {
    const userId = ctx.from.id;
    const messageId = userMessageIds[userId];

    if (messageId) {
      try {
        await ctx.telegram.deleteMessage(userId, messageId);
        console.log(`Сообщение с ID ${messageId} удалено для пользователя ${userId}`);
        delete userMessageIds[userId];
      } catch (error) {
        console.error('Ошибка удаления сообщения:', error);
      }
    }

    ctx.reply('Введите ваш API ключ:');
  }
});

// Запуск бота
bot.launch()
  .then(() => console.log('Бот успешно запущен'))
  .catch((error) => console.error('Ошибка при запуске бота:', error));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
