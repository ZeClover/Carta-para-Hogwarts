"""Optional, verified offline preparation of the anonymous CC0 memory photograph."""
import hashlib, json, pathlib, subprocess, urllib.parse, urllib.request

root = pathlib.Path(__file__).resolve().parent.parent
cache = pathlib.Path('/tmp/hogwarts-memory-source')
cache.mkdir(exist_ok=True)
headers = {'User-Agent': 'Carta-para-Hogwarts/2.0 (offline CC0 asset preparation)'}
def fetch(url):
    if urllib.parse.urlparse(url).hostname not in {'api.polyhaven.com', 'dl.polyhaven.org'}:
        raise ValueError('Unexpected asset host')
    return urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60).read()

asset_id = 'autumn_forest_01'
info = json.loads(fetch('https://api.polyhaven.com/assets?type=hdris'))[asset_id]
item = json.loads(fetch('https://api.polyhaven.com/files/' + asset_id))['tonemapped']
data = fetch(item['url'])
if len(data) != item['size'] or hashlib.md5(data).hexdigest() != item['md5']:
    raise ValueError('Official source size/checksum mismatch')
(cache / 'source.jpg').write_bytes(data)
(cache / 'source.json').write_text(json.dumps({
    'id': asset_id, 'authors': list(info['authors']), 'title': info['name'],
    'license': 'CC0-1.0', 'sourceUrl': 'https://polyhaven.com/a/' + asset_id,
    'licenseUrl': 'https://polyhaven.com/license',
    'files': [{'url': item['url'], 'md5': item['md5'], 'bytes': item['size']}],
}, indent=2))
subprocess.run(['node', 'scripts/prepare-memory.mjs', str(cache)], cwd=root, check=True)
