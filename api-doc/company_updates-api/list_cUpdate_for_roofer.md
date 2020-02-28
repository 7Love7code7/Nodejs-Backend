**List All Company Updates for the calling user**
----
  Returns json array of projects.

* **URL**

  **`/ api / listAllCompanyUpdatesForRoofer`**

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
		"total" : 22, //Integer value of total cUpdates
		"list" : [ {cUpdate Object}, {cUpdate Object}... ]
}
```
 
* **Error Response:**

  * **ErrorTag:** 100 (DB Error) <br />
    **Content:** 
```json
	{
		"errorTag" : 100,
		"message" : "Couldn't fetch from db"
	}
```