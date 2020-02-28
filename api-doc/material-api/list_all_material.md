**List All Materials**
----
  Returns json array of Materials.

* **URL**

  **`/ api / listAllMaterials`**

* **Method:**

  `GET`
  
*  **URL Params**
	`chunk` int (max no of data objects for 1 page)
	
	`page` int (Page number)

	`search` String (search keyword/string for "name" field)

   **Required:**
 
   `None`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
		"total" : 22, //Integer value of total Materials as per query
		"list" : [ {Material Object}, {Material Object}... ]
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