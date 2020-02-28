**Generate OTP for mobile login function**
----
  Triggers SMS with secret OTP to respective **(REGISTERED USER ONLY)**

* **URL**

  **`/ generateOTP`**

* **Method:**

  `POST`

*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**
```json
  {
      "phoneNumber" : "mobile no.",
      "dialCode" : "dial code for respective country"
  }
```
* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
    "msg" : "OTP sent successfully",
    "error" : false
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