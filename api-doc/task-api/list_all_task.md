**List All Tasks**
----
  Returns json array of Tasks.

* **URL**

  **`/ api / listAllTasks`**

* **Method:**

  `GET`
  
*  **URL Params**
	`chunk` int (max no of data objects for 1 page)
	
	`page` int (Page number)

	`search` String (search keyword/string for "taskName" field)

   **Required:**
 
   `None`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
		"total" : 22, //Integer value of total Tasks as per query
		"list" : [ {task Object}, {task Object}... ]
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