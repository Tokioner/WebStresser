import aiohttp
import asyncio
from aiohttp_socks import ProxyConnector
import ssl
import json
import re

async def check_proxy(proxy, lock, working_proxies):
    try:
        # Создаем соединение с SOCKS5-прокси
        connector = ProxyConnector.from_url(f'socks5://{proxy}')
        
        # Создаем SSL-контекст с отключенной проверкой сертификатов
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        async with aiohttp.ClientSession(connector=connector) as session:
            print(f'Проверка прокси: {proxy}')
            async with session.get('https://api.ipify.org?format=json', ssl=ssl_context, timeout=aiohttp.ClientTimeout(total=10)) as response:
                content_type = response.headers.get('Content-Type', '')
                response_text = await response.text()  # Получаем текст ответа
                
                # Проверяем статус ответа
                if response.status == 200:
                    try:
                        # Пытаемся распарсить JSON
                        data = json.loads(response_text)
                        if 'ip' in data:
                            print(f'Рабочий прокси: {proxy} - IP: {data["ip"]}')
                            working_proxies.add(proxy.strip())  # Добавляем рабочий прокси в множество
                            return
                    except json.JSONDecodeError:
                        print(f'Прокси {proxy} вернул некорректный JSON: {response_text}')
                        # Попытка извлечь IP из текста ответа
                        ip_match = re.search(r'(\d{1,3}\.){3}\d{1,3}', response_text)
                        if ip_match:
                            ip = ip_match.group(0)
                            print(f'Некорректный JSON, но найден IP: {ip} с прокси {proxy}')
                            working_proxies.add(proxy.strip())  # Добавляем прокси, если IP найден
                else:
                    print(f'Прокси {proxy} не работает. Статус: {response.status}. Ответ: {response_text}')
    except asyncio.TimeoutError:
        print(f'Прокси {proxy} не ответил в установленный срок.')
    except Exception as e:
        print(f'Ошибка при проверке прокси {proxy}: {e}')

async def main(proxies):
    lock = asyncio.Lock()  # Создаем блокировку
    working_proxies = set()  # Создаем множество для хранения рабочих прокси
    tasks = [check_proxy(proxy.strip(), lock, working_proxies) for proxy in proxies]
    await asyncio.gather(*tasks)

    # Подсчитываем рабочие и нерабочие прокси
    total_proxies = len(proxies)
    working_count = len(working_proxies)  # Количество рабочих прокси
    non_working_count = total_proxies - working_count  # Количество нерабочих прокси

    # Записываем только рабочие прокси в файл
    with open('proxies.txt', 'w') as result_file:
        for proxy in working_proxies:
            result_file.write(f'{proxy}\n')

    # Уведомление о завершении и статистике
    print(f'\nЗапись результатов завершена. Рабочие прокси: {working_count}, Нерабочие прокси: {non_working_count}')
    print(f'Рабочие прокси записаны в файл result.txt.')
    input('')

if __name__ == '__main__':
    try:
        with open('MainList.txt', 'r') as file:
            proxies = file.readlines()
        asyncio.run(main(proxies))
    except Exception as e:
        print(f'Ошибка при запуске программы: {e}')
