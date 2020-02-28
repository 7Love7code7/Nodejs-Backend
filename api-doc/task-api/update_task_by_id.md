**List task By Id**
----
  Returns json Object a requested task.

* **URL**

  **`/ api / updateTaskById / :taskId`**

* **Method:**

  `PUT`
  
*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

```json
{
	updated task Object
}
```

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
	task Object
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