import { App, Modal, Setting } from 'obsidian';
import { t } from './i18n';
export function approveChromeConnection(app: App, origin: string): Promise<boolean> {
  return new Promise(resolve => {
    class ConnectionModal extends Modal {
      private approved = false;
      onOpen() {
        this.titleEl.setText(t('connectChromeTitle'));
        this.contentEl.createEl('p', { text: t('connectChromeDescription') });
        this.contentEl.createEl('code', { text: origin });
        new Setting(this.contentEl).addButton(button => button.setButtonText(t('cancel')).onClick(() => this.close()))
          .addButton(button => button.setButtonText(t('connectChromeTitle')).setCta().onClick(() => { this.approved = true; this.close(); }));
      }
      onClose() { resolve(this.approved); this.contentEl.empty(); }
    }
    new ConnectionModal(app).open();
  });
}
