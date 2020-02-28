**List All projects**
----
  Returns json array of projects.

* **URL**

  **`/ api / listAllProjects`**

* **Method:**

  `GET`
  
*  **URL Params**
	`chunk` int (max no of data objects for 1 page)
	
	`page` int (Page number)

	`active` Bool (required status of projects //active=true by default )

	`search` String (search keyword/string)

	`lat` float (value of latitude // will be ignored if lng not specified)

	`lng` float (value of longitude // will be ignored if lat not specified)

	`minDate` ISO Date String (lower limit of a date window)

	`maxDate` ISO Date String (upper limit of a date window)
   **Required:**
 
   `None`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
		"total" : 22, //Integer value of total projects as per query
		"list" : [ {Project Object}, {Project Object}... ]
}
```
 
* **Error Response:**

  * **ErrorTag:** 106 (INVALID QUERY PARAMS) <br />
    **Content:** 
```json
	{
		"errorTag" : 106,
		"message" : "invalid date query"
	}
```