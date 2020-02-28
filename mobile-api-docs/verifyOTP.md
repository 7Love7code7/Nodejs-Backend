**Verify OTP for mobile device**
----
  Returns token and user object

* **URL**

  **`/ verfiyOTP`**

* **Method:**

  `POST`

*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**
```json
  {
      "otp" : "otp_string",
      "phoneNumber" : "mobile no.",
      "dialCode" : "dial code for respective country"
  }
```
* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
    "verified": true,
    "user": Logged In User Object,
    "message": "Enjoy your token!",
    "token": "token_string"
}
```
 
* **Error Response:**

    **Content:** 
```json
    {
        "err" : "error code", 
        "message" : "error message"
    }
```