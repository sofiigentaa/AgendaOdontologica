import com.kms.katalon.core.testobject.ConditionType
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

String baseUrl = System.getenv('KATALON_BASE_URL') ?: 'http://localhost:3000'

TestObject byCss(String css) {
  TestObject t = new TestObject()
  t.addProperty('css', ConditionType.EQUALS, css)
  return t
}

WebUI.openBrowser('')
WebUI.navigateToUrl(baseUrl)
WebUI.setText(byCss('[data-testid="auth-email"]'), 'e2e@consultorio.test')
WebUI.setText(byCss('[data-testid="auth-password"]'), 'admin123')
WebUI.click(byCss('[data-testid="auth-submit"]'))
WebUI.verifyElementNotPresent(byCss('[data-testid="auth-email"]'), 10)
WebUI.click(byCss('#tab-calendar-main'))
WebUI.verifyTextPresent('HOY', false)
WebUI.click(byCss('[data-testid="calendar-view-list"]'))
WebUI.verifyTextPresent('Lista Cronológica de Turnos', false)
WebUI.click(byCss('#btn-open-finances'))
WebUI.verifyTextPresent('Finanzas y Liquidación de Honorarios', false)
WebUI.closeBrowser()
