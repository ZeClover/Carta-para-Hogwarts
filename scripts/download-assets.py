"""Fetch official API URLs and verify its MD5 values. No browser/runtime API calls."""
import argparse, hashlib, json, pathlib, urllib.request, urllib.parse
parser = argparse.ArgumentParser()
parser.add_argument('--cache', default='/tmp/hogwarts-polyhaven')
args = parser.parse_args()
cache = pathlib.Path(args.cache)
cache.mkdir(parents=True, exist_ok=True)
headers = {'User-Agent': 'Carta-para-Hogwarts/1.1 (offline CC0 asset preparation)'}
def fetch(url):
    if urllib.parse.urlparse(url).hostname not in {'api.polyhaven.com', 'dl.polyhaven.org'}:
        raise ValueError('Unexpected asset host')
    return urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60).read()
models = json.loads(fetch('https://api.polyhaven.com/assets?type=models'))
selected = ['ClassicConsole_01', 'ornate_mirror_01', 'fancy_picture_frame_01', 'ArmChair_01']
manifest = []
for asset_id in selected:
    info = models[asset_id]
    files = json.loads(fetch('https://api.polyhaven.com/files/' + asset_id))
    chosen = files['gltf']['1k']['gltf']
    root = cache / asset_id
    root.mkdir(exist_ok=True)
    entries = {asset_id + '.gltf': chosen, **chosen.get('include', {})}
    total = 0
    checksums = []
    for relative, item in entries.items():
        path = root / relative
        if not path.resolve().is_relative_to(root.resolve()):
            raise ValueError('Unsafe asset path')
        data = fetch(item['url'])
        if len(data) != item['size'] or hashlib.md5(data).hexdigest() != item['md5']:
            raise ValueError('Official size/checksum mismatch for ' + relative)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        total += len(data)
        checksums.append({'url': item['url'], 'md5': item['md5'], 'bytes': len(data)})
    manifest.append({'id': asset_id, 'title': info['name'], 'authors': list(info['authors']), 'license': 'CC0-1.0', 'sourceUrl': 'https://polyhaven.com/a/' + asset_id, 'licenseUrl': 'https://polyhaven.com/license', 'apiFilesUrl': 'https://api.polyhaven.com/files/' + asset_id, 'sourceBytes': total, 'files': checksums})
    print(asset_id + ': ' + str(total) + ' bytes verified')
(cache / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
