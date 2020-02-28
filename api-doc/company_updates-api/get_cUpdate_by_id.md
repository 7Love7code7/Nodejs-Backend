**List companyUpdate By Id**
----
  Returns json Object a requested companyUpdate.

* **URL**

  **`/ api / getCompanyUpdateById / :companyUpdateId`**

* **Method:**

  `GET`
  
*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

  None

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