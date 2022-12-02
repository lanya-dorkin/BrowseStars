import config
from pymongo import MongoClient
from brawlstats import Client, BattleLog
from brawlstats.errors import Forbidden
import asyncio
from functools import reduce
from operator import iconcat
from datetime import datetime
from langdetect import detect
import argparse


parser = argparse.ArgumentParser()
parser.add_argument("--start", help="Player tags (without #, spaced) from which the crawler will start", 
                    type=str, nargs='+', default=['YP9PCJ298', '8QLCLVVV8', '99V9PJLJU', '2YJ9CGYG'])
parser.add_argument("--batch_new", type=int, default=16, 
                    help="Amount of async requests the crawler will do at the same time to search for new clubs")
parser.add_argument("--qsize_new", type=int, default=512, 
                    help="Amount of tags in the queue to get processed to search for new clubs")
parser.add_argument("--batch_update", type=int, default=4, 
                    help="Amount of async requests the crawler will do at the same time to update existing clubs")
parser.add_argument("--qsize_update", type=int, default=128, 
                    help="Amount of tags in the queue to get processed to update existing clubs")
parser.add_argument("--monitor", type=int, default=60, 
                    help="Interval in seconds the script will remind of the clubs collected")
parser.add_argument("--print_errors", type=bool, default=False, 
                    help="Whether or not to print errors")
args = parser.parse_args()

mongo_client = MongoClient(f"mongodb://{config.mongo['username']}:{config.mongo['password']}@{config.mongo['host']}:{config.mongo['port']}")
db = mongo_client[config.mongo['db_name']]
collection = db[config.mongo['collection_name']]

stats_client = Client(config.brawl_api_token, is_async=True)
start_time = datetime.now()
unique_clubs_at_start = collection.count_documents({})

def get_new_players(battle_logs: BattleLog, player_tag: str) -> set[str]:
    battles = [b['battle'] for b in battle_logs]
    players = [[p['tag'] for p in b['players']] if b.get('players') else [p['tag'] for t in b['teams'] for p in t] for b in battles]
    players = set(reduce(iconcat, players))
    players.remove(player_tag)
    return players

async def players_consumer(players_queue: asyncio.Queue) -> None:
    while True:
        player_tag = await players_queue.get()
        try:
            player = await stats_client.get_player(player_tag)
            if player.club:
                await consume_club(player.club['tag'])
            battle_logs = await stats_client.get_battle_logs(player_tag)
            for new_player_tag in get_new_players(battle_logs, player_tag):
                try:  
                    players_queue.put_nowait(new_player_tag)
                except asyncio.QueueFull:
                    pass
        except Exception as e:
            if args.print_errors:
                print(player_tag, type(e), sep='\t')
        players_queue.task_done()

async def consume_club(club_tag: str) -> None:
    try:
        club = await stats_client.get_club(club_tag)
        try:
            lang = detect(club.description)
        except:
            lang = None
        club = {'tag': club.tag, 'name': club.name, 'description': club.description, 'type': club.type, 
                'required_trophies': club.required_trophies, 'trophies': club.trophies, 'members': len(club.members), 
                'language': lang, 'last_update': datetime.now()}
        collection.replace_one({'tag': club_tag}, club, True)
    except Exception as e:
        if args.print_errors:
            print(club_tag, type(e), sep='\t')

async def clubs_producer(clubs_queue: asyncio.Queue) -> None:
    while True:
        oldest_clubs = collection.find({}, sort=[('last_update', 1)], limit=args.qsize_update, projection={'tag': True, '_id': False})
        for club in oldest_clubs:
            await clubs_queue.put(club['tag'])

async def clubs_consumer(clubs_queue: asyncio.Queue) -> None:
    while True:
        club_tag = await clubs_queue.get()
        await consume_club(club_tag)
        clubs_queue.task_done()

async def monitor(interval: int) -> None:
    while True:
        unique_clubs = collection.count_documents({})
        updated_since_start = collection.count_documents({'last_update': {'$gt': start_time}})
        print(f"\n{datetime.now().strftime('%H:%M:%S')}:\n\tunique clubs: {unique_clubs} ~~~ new clubs: {unique_clubs - unique_clubs_at_start} ~~~ processed clubs: {updated_since_start}\n")
        await asyncio.sleep(interval)

async def main() -> None:
    tasks = []
    
    if args.start and args.qsize_new > 0 and args.batch_new > 0:
        players_queue = asyncio.Queue(args.qsize_new) 
        for tag in args.start:
            await players_queue.put(f'#{tag}')
        tasks.extend([asyncio.create_task(players_consumer(players_queue)) for _ in range(args.batch_new)])
    else:
        print("Search for new clubs was not started because there are no starter tags or the queue size or the batch size is less than 1")
    
    if args.qsize_update > 0 and args.batch_update > 0:
        clubs_queue = asyncio.Queue(args.qsize_update)
        tasks.append(asyncio.create_task(clubs_producer(clubs_queue)))
        tasks.extend([asyncio.create_task(clubs_consumer(clubs_queue)) for _ in range(args.batch_update)])
    else:
        print("Update of existing clubs was not started because the queue size or the batch size is less than 1")
    
    if args.monitor > 0:
        tasks.append(asyncio.create_task(monitor(args.monitor)))
    else:
        print("Monitoring was not started because the value of the parameter was less than 1")
    
    try:
        await asyncio.gather(*tasks)
    except Forbidden as e:
        print("\n"+e.message)
        print("Visit to get valid API key https://developer.brawlstars.com/#/account")

loop = asyncio.get_event_loop()
loop.run_until_complete(main())