**Create new Project**
----
  Creates and returns json Object of Created Company update.

* **URL**

  **`/ api / createCompanyUpdate`**

* **Method:**

  `POST`
  
*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

  update/report object

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
	companyUpdate Object
}
```
 
* **Error Response:**

  * **ErrorTag:** 100 (DB ERROR) <br />
    **Content:** 
```json
    {
        "err" : 100, 
        "message" : "error fetching list"
    }
```