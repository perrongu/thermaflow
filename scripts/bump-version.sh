#!/bin/bash
# Script de bump de version SemVer pour ThermaFlow
# Usage: ./scripts/bump-version.sh [patch|minor|major]

set -e

VERSION_FILE="js/constants/version.js"
PACKAGE_FILE="package.json"
LOCK_FILE="package-lock.json"

if [ $# -ne 1 ]; then
  echo "Usage: $0 [patch|minor|major]"
  exit 1
fi

TYPE=$1

if [[ ! "$TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "Erreur: type doit être patch, minor ou major"
  exit 1
fi

# Extraire version actuelle depuis version.js (source de vérité)
CURRENT_VERSION=$(grep "const VERSION = " "$VERSION_FILE" | sed "s/.*const VERSION = '\\(.*\\)';/\\1/")

if [ -z "$CURRENT_VERSION" ]; then
  echo "Erreur: impossible d'extraire la version depuis $VERSION_FILE"
  exit 1
fi

# Calculer nouvelle version
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $TYPE in
  patch)
    PATCH=$((PATCH + 1))
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

echo "Bump version: $CURRENT_VERSION → $NEW_VERSION ($TYPE)"

# Mettre à jour version.js (source de vérité)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/const VERSION = '$CURRENT_VERSION'/const VERSION = '$NEW_VERSION'/" "$VERSION_FILE"
  sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_FILE"
  sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/g" "$LOCK_FILE"
else
  # Linux
  sed -i.bak "s/const VERSION = '$CURRENT_VERSION'/const VERSION = '$NEW_VERSION'/" "$VERSION_FILE"
  sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_FILE"
  sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/g" "$LOCK_FILE"
  rm -f "${VERSION_FILE}.bak" "${PACKAGE_FILE}.bak" "${LOCK_FILE}.bak"
fi

echo "✅ Version mise à jour: $NEW_VERSION"
echo ""
echo "Fichiers modifiés:"
echo "  - $VERSION_FILE"
echo "  - $PACKAGE_FILE"
echo "  - $LOCK_FILE"
echo ""
echo "⚠️  N'oubliez pas de mettre à jour docs/CHANGELOG.md"

