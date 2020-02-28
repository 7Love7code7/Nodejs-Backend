**List All RooferAllotments for a Project**
----
  Returns json array of RooferAllotments.

* **URL**

  **`/ api / listAllRooferAllotmentsByProjectId / :projectId`**

* **Method:**

  `GET`
  
*  **URL Params**
	`chunk` int (max no of data objects for 1 page)
	
	`page` int (Page number)

	`search` String (search keyword/string for "rooferName" field)

   **Required:**
 
   `None`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
		"total" : 22, //Integer value of total RooferAllotments as per query
		"list" : [ {RooferAllotment Object}, {RooferAllotment Object}... ]
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