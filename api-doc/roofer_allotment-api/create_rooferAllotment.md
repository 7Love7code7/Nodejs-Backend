**Create rooferAllotment By Project Id**
----
  Returns json Object a created rooferAllotment.

* **URL**

  **`/ api / createRooferAllotment`**

* **Method:**

  `POST`
  
*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

```json
{
	rooferAllotment Object to create
}
```

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
	created rooferAllotment Object
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