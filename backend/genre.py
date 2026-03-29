# this will be used to normalise the noisy genre data to a less noisy for better genre  injection in playlist

# Idea is to make user play match the following, hindi ost -> | -> bollywood
#
# to do that i m gonna use json to store it in /data folder


# use fuzzy matching to outmatically change genre of the highest matching genre

# ISSUES : IDK how to discribe, when fuzzy matching punjabi and punjabi pop both matches punjabi and pop with high fuzz  score creating this
# tunelog-backend   | Request recived to read data from json
# tunelog-backend   | File missing or corrupted. Resetting to default...
# tunelog-backend   | Request recived to read data from json
# tunelog-backend   | writng
# tunelog-backend   | writng
# tunelog-backend   | writng
# tunelog-backend   | Starting bulk update for : 1 Genre
# tunelog-backend   | [('pop', 'punjabi')]
# tunelog-backend   | writng
# tunelog-backend   | Starting bulk update for : 1 Genre
# tunelog-backend   | [('pop', 'punjabi')]
# tunelog-backend   | writng
# tunelog-backend   | Starting bulk update for : 1 Genre
# tunelog-backend   | [('pop', 'punjabi')]
# tunelog-backend   | writng
# tunelog-backend   | Starting bulk update for : 1 Genre
# tunelog-backend   | [('pop', 'punjabi')]
# tunelog-backend   | writng
# tunelog-backend   | writng
# tunelog-backend   | writng

# fix: stop looking if exact match or fuzzy score = 100


import json
from rapidfuzz import fuzz
from misc import UpdateDBgenre
from db import get_db_connection , get_db_connection_lib

FILE_PATH = "./data/genre.json"
# data = {
#     "Bollywood": ["Hindi OST", "Hindi", "Bollywood Pop"],
#     "Hip-Hop": ["Rap", "RnB"],
#     "Unmapped": ["Bhangra", "Indie Rock"],
# }


def writeJson(genre, noisyGenre):
    try:
        with open(FILE_PATH, "r") as file:
            oldData = json.load(file)
    except FileNotFoundError:
        oldData = {}

    genre = genre.title()

    for values in oldData.values():
        if noisyGenre in values:
            return oldData

    if genre not in oldData:
        oldData[genre] = []

    oldData[genre].append(noisyGenre)

    with open(FILE_PATH, "w") as file:
        json.dump(oldData, file)

    return oldData


def readJson():
    default_data = {"app": "Tunelog"}

    try:
        with open(FILE_PATH, "r") as file:
            data = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        print("File missing or corrupted. Resetting to default...")
        with open(FILE_PATH, "w") as file:
            json.dump(default_data, file, indent=4)
        data = default_data

    data.pop("app", None)

    return data


def DeleteDataJson(category, value = None):
    try:
        with open(FILE_PATH , "r") as file:
            data = json.load(file)

        if value is None :
            del data[category]
            print("Deleted the whole category : " , category)

        else:
            if value in data[category] :
                data[category].remove(value)
                print("Value : ", value ,"Delete from category : " , category)
            else:
                print("Value does not exist")

        with open(FILE_PATH , "w" ) as file:
            json.dump(data , file , indent=4 )
            return data

    except FileNotFoundError:
        print("ERROR : File does not exist")


def score(input , output):
    t_score = fuzz.token_set_ratio(input, output)
    return round(t_score )


def autoGenre(data):
    conn_lib = get_db_connection_lib()
    cursor = conn_lib.cursor()
    distinctGenre = cursor.execute(
        "SELECT DISTINCT genre FROM library WHERE explicit IS NOT NULL"
    ).fetchall()
    conn_lib.close()

    genres = [row[0] for row in distinctGenre]
    mapping = []  

    all_known_terms = set()
    for cat, vals in data.items():
        all_known_terms.add(cat.lower())
        for v in vals:
            all_known_terms.add(v.lower())

    for genre1 in genres:

        if not genre1 or genre1.lower() in all_known_terms:
            continue

        best_score = 0
        best_match = None

        for category, values in data.items():

            cat_score = score(category, genre1)
            if cat_score > best_score:
                best_score = cat_score
                best_match = category


            for value in values:
                v_score = score(value, genre1)
                if v_score > best_score:
                    best_score = v_score
                    best_match = category

            if best_score == 100:
                break

        if best_match and best_score >= 95:
            print(f"Auto-Mapping Found: {genre1} -> {best_match} ({best_score}%)")

            mapping.append((best_match, genre1))


            writeJson(best_match, genre1)

    if mapping:
        print(f"Starting bulk update for : {len(mapping)} Genres")
        db_result = UpdateDBgenre(mapping)
        return {"updated_count": len(mapping), "db_status": db_result}

    return {"status": "No changes needed", "updated_count": 0}
