Feature: SauceDemo Login
  In order to verify the login flow for Sauce Demo
  As a user
  I want to be able to log in with the standard_user account

  @TC-001
  Scenario: TC-001_Positive - Standard user login (happy path)
    Given I open the Sauce Demo login page
    When I enter login credentials
    And I click the Login button
    Then I should be redirected to the inventory page
    And I should see at least one product in the inventory
    And no error message should be displayed
  
  @TC-002
  Scenario: TC-002 - Negative - Locked out user
    Description: Verify that a locked-out user cannot log in.
      This scenario uses credentials provided from the Excel test data (sheet `TC_Data`, TC_ID = TC-002).
      Expected behavior: the user remains on the login page and sees an account-locked error message.

    Given I open the Sauce Demo login page
    When I enter login credentials
    And I click the Login button
    Then I should remain on the login page
    And an account locked error message should be displayed

  @TC-003
  Scenario: TC-003 - Negative - Invalid credentials
    Description: Verify that invalid credentials fail to log in.
      This scenario uses credentials provided from the Excel test data (sheet `TC_Data`, TC_ID = TC-003).
      Expected behavior: the user remains on the login page and sees an invalid-credentials error message.

    Given I open the Sauce Demo login page
    When I enter login credentials
    And I click the Login button
    Then I should remain on the login page
    And an invalid credentials error message should be displayed

  @TC-004
  Scenario: TC-004 - Negative - Empty username
    Description: Verify that leaving the username blank triggers a validation error.
      This scenario uses credentials from Excel (Password only; Username blank) for TC-004.
      Expected behavior: the user stays on login page and a username required error message is shown.

    Given I open the Sauce Demo login page
    When I enter login credentials
    And I click the Login button
    Then I should remain on the login page
    And a missing username error message should be displayed

  @TC-005
  Scenario: TC-005 - Negative - Empty password
    Description: Verify that leaving the password blank triggers a validation error.
      This scenario uses credentials from Excel (Username only; Password blank) for TC-005.
      Expected behavior: the user stays on login page and a password required error message is shown.

    Given I open the Sauce Demo login page
    When I enter login credentials
    And I click the Login button
    Then I should remain on the login page
    And a missing password error message should be displayed

  @TC-006
  Scenario: TC-006 - Edge - SQL/Script injection attempt in username
    Description: Ensure potential SQL/script injection strings are safely handled.
      This scenario uses a crafted username and valid password; expected: authentication failure without server error.
      Expected behavior: the user stays on login page and sees a generic invalid credentials error; no stack trace or raw exception.

    Given I open the Sauce Demo login page
    When I enter login credentials
    And I click the Login button
    Then I should remain on the login page
    And an injection attempt should be handled safely

  @TC-007
  Scenario: TC-007 - Edge - Excessively long username/password
    Description: Verify system handles extremely long credential inputs gracefully (no crash, generic error).
      This scenario uses 5000 'a' characters for both username and password.
      Expected behavior: invalid credentials error; no server exception or performance hang.

    Given I open the Sauce Demo login page
    When I enter login credentials
    And I click the Login button
    Then I should remain on the login page
    And an excessively long credentials attempt should be handled safely
  
  @TC-008
  Scenario: TC-008 - Usability - Show/hide password toggle (if present)
    Description: Verify that the password visibility toggle reveals and re-masks the password when used.
      This scenario uses a valid password and ignores username need (will supply a valid username from Excel data).
      Expected behavior: If toggle exists, clicking it reveals the password text then re-masks when clicked again. If absent, scenario is marked as Not Applicable.

    Given I open the Sauce Demo login page
    When I enter login credentials
    And I toggle the password visibility if available
    Then I should remain on the login page
    And the password visibility toggle behavior should be verified or marked N/A