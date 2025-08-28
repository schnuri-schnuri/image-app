#!/bin/bash

# Stellen Sie sicher, dass der API-Schlüssel gesetzt ist
if [ -z "$WITHOUTBG_API_KEY" ]; then
  echo "Fehler: WITHOUTBG_API_KEY Umgebungsvariable ist nicht gesetzt"
  echo "Bitte setzen Sie die Variable mit: export WITHOUTBG_API_KEY=your_api_key_here"
  exit 1
fi

# Testbild herunterladen, falls nicht vorhanden
if [ ! -f "test_image.jpg" ]; then
  echo "Lade Testbild herunter..."
  curl -o test_image.jpg https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png
fi

# Direkter Test der WithoutBG API
echo "Teste WithoutBG API direkt..."
curl -v -X POST "https://api.withoutbg.com/v1.0/image-without-background" \
  -H "X-API-Key: $WITHOUTBG_API_KEY" \
  -F "file=@test_image.jpg" \
  --output result.png

echo "Falls erfolgreich, sollte eine Datei 'result.png' erstellt worden sein."
