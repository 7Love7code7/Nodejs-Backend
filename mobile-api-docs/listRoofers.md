**List brief details of roofers**
----
  Returns list of requested roofers.

* **URL**

  **`/ api /listGivenRoofers`**

* **Method:**

  `POST`
  
*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

  ["list_of_required_user's_ids","", "","", ...]

    List of all roofers given in as array of ids in request
    Eg. of body :
        ["id1", "id2"......,"idn"]
     

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
[
    "rooferObject1",
    "rooferObject2",
    "rooferObject3",
    "rooferObject4",
    .
    .
    .
]
```
 
* **Error Response:**

  * **ErrorTag:** 100 (DB ERROR) <br />
    **Content:** 
```json
    {
        "err" : "error code", 
        "message" : "error message"
    }
```