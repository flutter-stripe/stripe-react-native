/* eslint-disable no-undef */
import { getElementByText, getTextInputByPlaceholder } from '../helpers';
class BasicPaymentScreen {
  pay({
    email,
    bankName,
    iban,
    buttonText = 'Pay',
  }: {
    email: string;
    bankName?: string;
    iban?: string;
    buttonText?: string;
  }) {
    getTextInputByPlaceholder('E-mail').waitForDisplayed({ timeout: 10000 });
    getTextInputByPlaceholder('E-mail').setValue(email);

    if (bankName && driver.isAndroid) {
      const select = getElementByText('Optional - choose your bank');
      expect(select).toBeDisplayed();
      select.click();
      const listItem = getElementByText(bankName);
      listItem.click();
    }
    if (iban) {
      const ibanInput = getTextInputByPlaceholder('Iban');
      expect(ibanInput).toBeDisplayed();
      ibanInput.setValue(iban);
    }

    const button = driver.isAndroid
      ? $(
          `android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().text("${buttonText}"))`
        )
      : $(`~${buttonText}`);
    expect(button).toBeDisplayed();
    button.click();

    driver.pause(5000);
  }

  authorize({ pause = 5000 } = {}) {
    driver.pause(pause);

    // We can have multiple webview contexts, so we return all of them and then try going through each one.
    // Since we're potentially interacting with unmounted Webviews, we need to catch() any potential errors,
    // but we can safely do so as the test would still fail after we return back to the native context.
    const webviewContexts = getAllWebviewContexts();
    for (const context of webviewContexts) {
      try {
        driver.switchContext(context);

        const success = clickAuthorizeButton();
        if (success) {
          driver.pause(1000);
          break;
        }
      } catch (e) {
        console.log(
          `Unable to switch to ${context} context. This context may no longer exist.`
        );
      }
    }
    driver.switchContext(getNativeContext());
  }

  checkStatus(status: string = 'Success') {
    const alert = getElementByText(status);
    alert.waitForDisplayed({
      timeout: 10000,
    });
    expect(alert.getText()).toEqual(status);
  }
}

export function getAllWebviewContexts(): string[] {
  let allContexts = driver.getContexts();
  if (driver.isIOS) {
    // Hacky workaround for https://github.com/appium/appium/issues/13770
    driver.pause(1000);
    allContexts = driver.getContexts();
  }

  const webviewContext = allContexts.filter((contextName) =>
    contextName.toLowerCase().includes('webview')
  );

  return webviewContext.sort((a, b) => {
    if (a.includes('stripe') && !b.includes('stripe')) {
      return -1;
    } else if (b.includes('stripe') && !a.includes('stripe')) {
      return 1;
    }
    return 0;
  });
}

export function getNativeContext(): string {
  const allContexts = driver.getContexts();

  const nativeContext = allContexts.find((contextName) =>
    contextName.toLowerCase().includes('native')
  );
  if (!nativeContext) {
    throw new Error('No native context was found.');
  }

  return nativeContext;
}

function clickAuthorizeButton(): boolean {
  return ['button', 'a'].some((elementType: string) => {
    const element = $(`${elementType}*=Authorize`);
    if (element.isDisplayed()) {
      element.click();
      return true;
    } else {
      return false;
    }
  });
}

export default new BasicPaymentScreen();
