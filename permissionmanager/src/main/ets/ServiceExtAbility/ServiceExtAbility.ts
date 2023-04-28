/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import extension from '@ohos.app.ability.ServiceExtensionAbility';
import window from '@ohos.window';
import display from '@ohos.display';
import deviceInfo from '@ohos.deviceInfo';

var TAG = "PermissionManager_Log:";
const BG_COLOR = '#00000000'
let bottomPopoverTypes = ['default', 'phone']

export default class ServiceExtensionAbility extends extension {
    /**
     * Lifecycle function, called back when a service extension is started for initialization.
     */
    onCreate(want) {
        console.info(TAG + "ServiceExtensionAbility onCreate, ability name is " + want.abilityName);

        globalThis.extensionContext = this.context;
        globalThis.windowNum = 0
    }

  /**
  * Lifecycle function, called back when a service extension is started or recall.
  */
  onRequest(want, startId) {
    console.info(TAG + "ServiceExtensionAbility onRequest. start id is " + startId);
    console.info(TAG + 'want: ' + JSON.stringify(want));

    try {
      let dis = display.getDefaultDisplaySync();
      let navigationBarRect = {
        left: 0,
        top: 0,
        width: dis.width,
        height: dis.height
      };
      let isVertical = dis.width > dis.height ? false : true;
      globalThis.isBottomPopover = (bottomPopoverTypes.includes(deviceInfo.deviceType) && isVertical) ? true : false;
      this.createWindow('permissionDialog' + startId, window.WindowType.TYPE_DIALOG, navigationBarRect, want);
    } catch (exception) {
      console.error(TAG + 'Failed to obtain the default display object. Code: ' + JSON.stringify(exception));
    };
  }

    /**
     * Lifecycle function, called back before a service extension is destroyed.
     */
    onDestroy() {
        console.info(TAG + "ServiceExtensionAbility onDestroy.");
    }

  private async createWindow(name: string, windowType, rect, want): Promise<void> {
    console.info(TAG + 'create window');
    try {
      const win = await window.createWindow({ ctx: globalThis.extensionContext, name, windowType });
      let storage: LocalStorage = new LocalStorage({
        'want': want,
        'win': win
      });
      await win.bindDialogTarget(want.parameters['ohos.ability.params.token'].value, () => {
        win.destroyWindow();
        globalThis.windowNum --;
        if (globalThis.windowNum === 0) {
          this.context.terminateSelf();
        }
      });
      await win.moveWindowTo(rect.left, rect.top);
      await win.resize(rect.width, rect.height);
      await win.loadContent('pages/dialogPlus', storage);
      await win.setWindowBackgroundColor(BG_COLOR);
      await win.showWindow();
      globalThis.windowNum ++;
    } catch {
      console.info(TAG + 'window create failed!');
    }
  }
};