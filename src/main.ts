import '@logseq/libs';
import { BlockEntity } from '@logseq/libs/dist/LSPlugin.user';

const settingsVersion = 'v2';
export const defaultSettings = {
  keyBindings: {
    1: 'ctrl+1',
    2: 'ctrl+2',
    3: 'ctrl+3',
    4: 'ctrl+4',
    5: 'ctrl+5',
    6: 'ctrl+6',
    7: 'ctrl+7',
    0: 'ctrl+0',
  },
  tasks: ['TODO', 'DOING', 'DONE', 'LATER', 'NOW', 'WAITING', 'CANCELLED'],
  settingsVersion,
  disabled: false,
};

export type DefaultSettingsType = typeof defaultSettings;

const initSettings = () => {
  let settings = logseq.settings;

  const shouldUpdateSettings =
    !settings || settings.settingsVersion != defaultSettings.settingsVersion;

  if (shouldUpdateSettings) {
    settings = defaultSettings;
    logseq.updateSettings(settings);
  }
};

const getSettings = (
  key: string | undefined,
  defaultValue: any = undefined
) => {
  let settings = logseq.settings;
  const merged = Object.assign(defaultSettings, settings);
  return key ? (merged[key] ? merged[key] : defaultValue) : merged;
};

async function main() {
  // settings
  initSettings();

  const keyBindings = getSettings('keyBindings', {});
  const tasks = getSettings('tasks', []);
  const regx = new RegExp(`^(${tasks.join('|')})`, 'gm');

  async function updateBlock(block: BlockEntity | null, taskBindedId: number) {
    if (!block?.uuid) {
      return;
    }
    let content = regx.test(block.content)
      ? block.content.replace(regx, '').trimStart()
      : block.content;
    if (taskBindedId > 0) {
      content = `${tasks[taskBindedId - 1]} ${content}`;
    }
    await logseq.Editor.updateBlock(block.uuid, content);
  }

  async function setTask(taskBoundId: number) {
    if (tasks.length < taskBoundId) {
      return;
    }

    const selected = await logseq.Editor.getSelectedBlocks();
    if (selected && selected?.length > 1) {
      for (let block of selected) {
        await updateBlock(block, taskBoundId);
      }
    } else {
      const block = await logseq.Editor.getCurrentBlock();
      await updateBlock(block, taskBoundId);
    }
  }

  for (let taskBoundId of Array(tasks.length + 1).keys()) {
    logseq.App.registerCommandPalette(
      {
        key: `task-management-shortcuts-task-${taskBoundId}`,
        label: `Set block to task ${taskBoundId}`,
        keybinding: {
          mode: 'global',
          binding: keyBindings[taskBoundId] || 'ctrl+' + taskBoundId,
        },
      },
      async () => {
        await setTask(taskBoundId);
      }
    );
  }
}

logseq.ready(main).catch(console.error);
