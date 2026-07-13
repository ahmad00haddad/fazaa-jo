import json
from graphify.detect import detect
from pathlib import Path

result = detect(Path('.'))
Path('graphify-out/.graphify_detect.json').write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
print(f"Total: {result['total_files']} files, ~{result['total_words']:,} words")
for k, v in result.get('files', {}).items():
    if v:
        print(f"  {k}: {len(v)} files")
