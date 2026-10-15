# Файлы для Unity-проекта

Скопируйте папку `Assets/` из этой директории в корень вашего Unity-проекта (содержимое сольётся с существующей `Assets/`).

1. `Project Settings → Player → Resolution and Presentation → WebGL Template → Physlab`
2. `Publishing Settings → Compression Format → Disabled` (на время разработки)
3. В сцене создайте объект **ModuleRoot** и повесьте на него `FrictionModule`.
4. `File → Build Profiles → WebGL → Build`
5. Результат сборки (`index.html` + `Build/`) положите в `physlab/public/modules/friction/`
   и поменяйте `buildUrl` модуля на `/modules/friction/index.html` (через `npx prisma studio`).

Сверьте переменные `{{{ ... }}}` в шаблоне с шаблоном Minimal вашей версии Unity.
