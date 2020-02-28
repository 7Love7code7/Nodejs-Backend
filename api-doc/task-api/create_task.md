**Create task By Project Id**
----
  Returns json Object a created task.

* **URL**

  **`/ api / createTaskForProject / :projectId`**

* **Method:**

  `POST`
  
*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

```json
{
	task Object to create
}
```

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
	created task Object
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