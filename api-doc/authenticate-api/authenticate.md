**Create new RooferConcern**
----
  Returns json of Verified User.

* **URL**

  **`/authenticate`**

* **Method:**

  `POST`
  
*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**
```json
 {
      "email" : "Email Id",
      "password" : "Password"
 }
```

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
	User Object
    Generated Token
}
```
 
* **Error Response:**

  * **ErrorTag:** 100 (DB ERROR) <br />
    **Content:** 
```json
    {
        "err" : 100, 
        "message" : "Server Error"
    }
```