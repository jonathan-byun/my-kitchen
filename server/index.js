require('dotenv/config');
const express = require('express');
const errorMiddleware = require('./error-middleware');
const staticMiddleware = require('./static-middleware');
const db = require('./db');

const app = express();

const jsonMiddleware = express.json();

app.use(staticMiddleware);

app.use(jsonMiddleware);

app.get('/api/stockedItems', (req, res, next) => {
  const userId = 1;

  const sql = `
    select
      "s"."stockedItemId",
      "i"."name",
      "i"."measurementUnit",
      "i"."foodCategory",
      "s"."quantity"
    from "Items" as "i"
    join "stockedItems" as "s" using ("itemId")
    join  "Users" as "u" using ("userId")
    where "u"."userId" = $1;
  `;

  const params = [userId];

  db.query(sql, params)
    .then(results => {
      const items = results.rows;
      res.json(items);
    })
    .catch(err => next(err));
});

app.get('/api/itemsInCategory/:categoryName', (req, res, next) => {
  const userId = 1;
  const categoryName = req.params.categoryName;
  const sql = `
    select
      "s"."stockedItemId",
      "i"."name",
      "i"."measurementUnit",
      "i"."foodCategory",
      "s"."quantity"
    from "Items" as "i"
    join "stockedItems" as "s" using ("itemId")
    join  "Users" as "u" using ("userId")
    where "u"."userId" = $1
    and "i"."foodCategory" = $2;
  `;

  const params = [userId, categoryName];

  db.query(sql, params)
    .then(results => {
      const items = results.rows;
      res.json(items);
    })
    .catch(err => next(err));
});

app.get('/api/stockedItemAt/:stockedItemId', (req, res, next) => {
  const userId = 1;
  const stockedItemId = req.params.stockedItemId;
  if (!Number.isInteger(Number(stockedItemId)) || stockedItemId < 1) {
    res.status(400).json({
      error: 'stockedItemId must be a positive integer'
    });
  }
  const sql = `
    select
      "i"."name",
      "i"."measurementUnit",
      "i"."foodCategory",
      "s"."quantity"
    from "Items" as "i"
    join "stockedItems" as "s" using ("itemId")
    join "Users" as "u" using ("userId")
    where "u"."userId" = $1
    and "s"."stockedItemId" = $2;
  `;

  const params = [userId, stockedItemId];

  db.query(sql, params)
    .then(results => {
      const [items] = results.rows;
      res.json(items);
    })
    .catch(err => next(err));
});

app.post('/api/newItem', (req, res, next) => {
  const userId = 1;
  const { name, quantity, measurementUnit, foodCategory } = req.body;
  if (!name) {
    res.status(400).json({
      error: 'Item must have name'
    });
  }
  if (!quantity || Number.isNaN(Number(quantity)) || quantity < 1) {
    res.status(400).json({
      error: 'Item must have quantity greater than 0'
    });
  }
  if (!measurementUnit) {
    res.status(400).json({
      error: 'Item must have measurement unit'
    });
  }
  if (!foodCategory) {
    res.status(400).json({
      error: 'Item must have food Category'
    });
  }

  const sql1 = `
    insert into "Items" ("name", "measurementUnit", "foodCategory")
    values ($1, $2, $3)
    returning *
  `;
  const params1 = [name, measurementUnit, foodCategory];

  db.query(sql1, params1)
    .then(result1 => {
      const [newItem] = result1.rows;
      const sql2 = `
        insert into "stockedItems" ("quantity", "userId", "itemId")
        values ($1, $2, $3)
        returning *
      `;

      const params2 = [quantity, userId, newItem.itemId];

      db.query(sql2, params2)
        .then(result => {
          const [newStockedItem] = result.rows;
          res.json(newStockedItem);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

app.patch('/api/stockedItemQuantity/:stockedItemId', (req, res, next) => {
  const stockedItemId = Number(req.params.stockedItemId);
  if (!Number.isInteger(stockedItemId) || stockedItemId < 1) {
    res.status(400).json({
      error: 'stockedItemId must be a positive integer'
    });
    return;
  }

  const { quantity } = req.body;
  if (Number.isNaN(quantity) || quantity < 0) {
    res.status(400).json({
      error: 'quantity must be a number greater than or equal to 0'
    });
  }

  const sql = `
    update "stockedItems"
      set "quantity" = $2
    where "stockedItemId" = $1
    returning "quantity"
  `;
  const params = [stockedItemId, quantity];

  db.query(sql, params)
    .then(results => {
      const [updatedQuantity] = results.rows;
      if (!updatedQuantity) {
        res.status(404).json({
          error: `Could not find quantity with stockedItemId ${stockedItemId}`
        });
        return;
      }
      res.json(updatedQuantity);
    })
    .catch(err => next(err));
});

app.patch('/api/stockedItemDetails/:stockedItemId', (req, res, next) => {
  const userId = 1;
  const id = Number(req.params.stockedItemId);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({
      error: 'stockedItemId must be a positive integer'
    });
  }
  const { quantity, name, measurementUnit, foodCategory } = req.body;
  const sql1 = `
    update "stockedItems"
      set "quantity" = $3
    where "stockedItemId" = $1
      and "userId" = $2
    returning *
  `;
  const params1 = [id, userId, quantity];

  db.query(sql1, params1)
    .then(result1 => {
      const [newItem] = result1.rows;
      const sql2 = `
        update "Items"
          set "name" = $2,
          "measurementUnit" = $3,
          "foodCategory" = $4
        where "itemId" = $1
        returning *
      `;

      const params2 = [newItem.itemId, name, measurementUnit, foodCategory];

      db.query(sql2, params2)
        .then(result => {
          const [newStockedItem] = result.rows;
          const responseObject = {
            name: newStockedItem.name,
            quantity: newItem.quantity,
            measurementUnit: newStockedItem.measurementUnit,
            foodCategory: newStockedItem.foodCategory,
            stockedItemId: newItem.stockedItemId
          };
          res.json(responseObject);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

app.delete('/api/deleteStockedItems', (req, res, next) => {
  const userId = 1;
  const idArray = (req.body.idArray);
  if (!idArray) {
    res.status(400).json({
      error: 'idArray cannot be empty'
    });
  }
  const sql = `
    delete from "stockedItems"
      where "userId" = $1
      and "stockedItemId" = any($2::int[])
    returning *;
  `;
  const params = [userId, idArray];

  db.query(sql, params)
    .then(result1 => {
      const itemId = result1.rows;
      const deleteItemArray = [];
      for (let i = 0; i < itemId.length; i++) {
        deleteItemArray.push(itemId[i].itemId);
      }
      const sql2 = `
        delete from "Items"
          where "itemId" = any($1::int[])
        returning *
      `;

      const params2 = [deleteItemArray];

      db.query(sql2, params2)
        .then(result2 => {
          const [deletedItem] = result2.rows;
          res.json(deletedItem);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

app.get('/api/getEdamam', (req, res, next) => {
  const edamamApiId = process.env.EDAMAM_API_ID;
  const edamamApiKey = process.env.EDAMAM_API_KEY;
  const response = {
    id: edamamApiId,
    key: edamamApiKey
  };
  res.json(response);
});

app.post('/api/favorites', (req, res, next) => {
  const userId = 1;
  const { recipeUri } = req.body;
  const sql = `
    insert into "Recipes" ("recipeUri")
    values ($1)
    returning "recipeId"
  `;
  const params = [recipeUri];

  db.query(sql, params)
    .then(result => {
      const [returningiD] = result.rows;
      const sql2 = `
        insert into "favoritedRecipes" ("userId", "recipeId")
        values ($1, $2)
        returning *
      `;
      const params2 = [userId, returningiD.recipeId];
      db.query(sql2, params2)
        .then(result2 => {
          const [favoritedReturn] = result2.rows;
          res.json(favoritedReturn);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

app.get('/api/getfavorites', (req, res, next) => {
  const userId = 1;
  const sql = `
    select
      *
    from "favoritedRecipes"
    join "Recipes" using ("recipeId")
    where "userId" = $1
  `;
  const params = [userId];
  db.query(sql, params)
    .then(results => {
      const favorites = [];
      for (const value of results.rows) {
        favorites.push(
          {
            favoriteId: value.favoritedRecipeId,
            uri: value.recipeUri
          }
        );
      }
      res.json(favorites);
    })
    .catch(err => next(err));
});

app.delete('/api/removefavorite/:id', (req, res, next) => {
  const userId = 1;
  const favoritedRecipeId = req.params.id;
  const sql = `
    delete from "favoritedRecipes"
      where "userId" = $1
      and "favoritedRecipeId" = $2
    returning "recipeId"
  `;
  const params = [userId, favoritedRecipeId];

  db.query(sql, params)
    .then(result => {
      const recipeId = result.rows[0].recipeId;
      const sql2 = `
        delete from "Recipes"
          where "recipeId" = $1
        returning *
      `;
      const params2 = [recipeId];
      db.query(sql2, params2)
        .then(result2 => {
          const [deletedRecipe] = result2.rows;
          res.json(deletedRecipe);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

app.get('/api/neededItems', (req, res, next) => {
  const userId = 1;

  const sql = `
    select
      "n"."neededItemId",
      "i"."name",
      "i"."measurementUnit",
      "i"."foodCategory"
    from "Items" as "i"
    join "neededItems" as "n" using ("itemId")
    join  "Users" as "u" using ("userId")
    where "u"."userId" = $1;
  `;

  const params = [userId];

  db.query(sql, params)
    .then(results => {
      const items = results.rows;
      res.json(items);
    })
    .catch(err => next(err));
});

app.get('/api/itemsNeededInCategory/:categoryName', (req, res, next) => {
  const userId = 1;
  const categoryName = req.params.categoryName;
  const sql = `
    select
      "n"."neededItemId",
      "i"."name",
      "i"."measurementUnit",
      "i"."foodCategory"
    from "Items" as "i"
    join "neededItems" as "n" using ("itemId")
    join  "Users" as "u" using ("userId")
    where "u"."userId" = $1
    and "i"."foodCategory" = $2;
  `;

  const params = [userId, categoryName];

  db.query(sql, params)
    .then(results => {
      const items = results.rows;
      res.json(items);
    })
    .catch(err => next(err));
});

app.post('/api/newNeededItem', (req, res, next) => {
  const userId = 1;
  const { name, foodCategory } = req.body;
  if (!name) {
    res.status(400).json({
      error: 'Item must have name'
    });
  }
  if (!foodCategory) {
    res.status(400).json({
      error: 'Item must have food Category'
    });
  }

  const sql1 = `
    insert into "Items" ("name", "measurementUnit", "foodCategory")
    values ($1, 'oz', $2)
    returning *
  `;
  const params1 = [name, foodCategory];

  db.query(sql1, params1)
    .then(result1 => {
      const [newItem] = result1.rows;
      const sql2 = `
        insert into "neededItems" ("userId", "itemId")
        values ($1, $2)
        returning *
      `;

      const params2 = [userId, newItem.itemId];

      db.query(sql2, params2)
        .then(result => {
          const [newNeededItem] = result.rows;
          res.json(newNeededItem);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

app.get('/api/neededItemAt/:neededItemId', (req, res, next) => {
  const userId = 1;
  const neededItemId = req.params.neededItemId;
  if (!Number.isInteger(Number(neededItemId)) || neededItemId < 1) {
    res.status(400).json({
      error: 'neededItemId must be a positive integer'
    });
  }
  const sql = `
    select
      "i"."name",
      "i"."foodCategory"
    from "Items" as "i"
    join "neededItems" as "n" using ("itemId")
    join "Users" as "u" using ("userId")
    where "u"."userId" = $1
    and "n"."neededItemId" = $2;
  `;

  const params = [userId, neededItemId];

  db.query(sql, params)
    .then(results => {
      const [items] = results.rows;
      res.json(items);
    })
    .catch(err => next(err));
});

app.patch('/api/neededItemDetails/:neededItemId', (req, res, next) => {
  const userId = 1;
  const id = Number(req.params.neededItemId);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({
      error: 'neededItemId must be a positive integer'
    });
  }
  const { name, foodCategory } = req.body;
  const sql = `
    select
      "itemId"
    from "neededItems"
    where "neededItemId" = $1
    and "userId" = $2;
  `;
  const params = [id, userId];

  db.query(sql, params)
    .then(result1 => {
      const [newItem] = result1.rows;
      const sql2 = `
        update "Items"
          set "name" = $2,
          "foodCategory" = $3
        where "itemId" = $1
        returning *;
      `;
      const params2 = [newItem.itemId, name, foodCategory];
      db.query(sql2, params2)
        .then(result2 => {
          res.json({ updated: result2.rows[0] });
        });
    })
    .catch(err => next(err));
});

app.delete('/api/deleteNeededItems', (req, res, next) => {
  const userId = 1;
  const idArray = (req.body.idArray);
  if (!idArray) {
    res.status(400).json({
      error: 'idArray cannot be empty'
    });
  }
  const sql = `
    delete from "neededItems"
      where "userId" = $1
      and "neededItemId" = any($2::int[])
    returning *;
  `;
  const params = [userId, idArray];

  db.query(sql, params)
    .then(result1 => {
      const itemId = result1.rows;
      const deleteItemArray = [];
      for (let i = 0; i < itemId.length; i++) {
        deleteItemArray.push(itemId[i].itemId);
      }
      const sql2 = `
        delete from "Items"
          where "itemId" = any($1::int[])
        returning *
      `;

      const params2 = [deleteItemArray];

      db.query(sql2, params2)
        .then(result2 => {
          const [deletedItem] = result2.rows;
          res.json(deletedItem);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

app.delete('/api/transferToStocked/:neededItemId', (req, res, next) => {
  const userId = 1;
  const id = Number(req.params.neededItemId);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({
      error: 'neededItemId must be a positive integer'
    });
  }

  const { quantity, measurementUnit } = req.body;

  const sql = `
  delete from "neededItems"
    where "userId" = $1
    and "neededItemId" = $2
  returning "itemId";
  `;

  const params = [userId, id];
  db.query(sql, params)
    .then(result => {
      const [deletedItemId] = result.rows;
      const sql2 = `
        update "Items"
          set "measurementUnit" = $2
        where "itemId" = $1
      `;
      const params2 = [deletedItemId.itemId, measurementUnit];
      db.query(sql2, params2)
        .then(result2 => {
          const sql3 = `
            insert into "stockedItems" ("itemId", "userId", "quantity")
            values($1, $2, $3)
            returning *
          `;
          const params3 = [deletedItemId.itemId, userId, quantity];
          db.query(sql3, params3)
            .then(result3 => {
              res.json(result3);
            })
            .catch(err => next(err));
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

app.post('/api/addToShop', (req, res, next) => {
  const userId = 1;
  const { idArray } = req.body;
  const checkSql = `
    select
     "itemId"
    from "neededItems"
    where "userId" = $1;
  `;
  const params = [userId];
  db.query(checkSql, params)
    .then(results => {
      const ids = results.rows;
      const existingIds = [];
      for (let i = 0; i < ids.length; i++) {
        existingIds.push(ids[i].itemId);
      }
      const getItemIdsSql = `
        select
          "itemId"
        from "stockedItems"
        where "userId" = $1
        and "stockedItemId" = any($2::int[]);
      `;
      const getItemIdsParams = [userId, idArray];
      db.query(getItemIdsSql, getItemIdsParams)
        .then(result2 => {
          const transferringIds = result2.rows;
          const transferringIdsArray = [];
          for (let i = 0; i < transferringIds.length; i++) {
            transferringIdsArray.push(transferringIds[i].itemId);
          }
          const finalArray = [];
          for (let i = 0; i < transferringIdsArray.length; i++) {
            if (existingIds.indexOf(transferringIdsArray[i]) === -1) {
              finalArray.push(transferringIdsArray[i]);
            }
          }
          if (finalArray.length < 1) {
            res.json('already in needed list');
          }
          let submitString = `(${userId}, ${finalArray[0]})`;
          if (finalArray.length > 1) {
            submitString = '(' + submitString;
          }
          for (let i = 1; i < finalArray.length; i++) {
            if (i === finalArray.length - 1) {
              submitString = submitString + ` ,(${userId}, ${finalArray[i]}))`;
            } else {
              submitString = submitString + ` ,(${userId}, ${finalArray[i]})`;
            }
          }
          const sql = `
            insert into "neededItems" ("userId", "itemId")
            values ${submitString}
          `;
          db.query(sql)
            .catch(err => next(err));
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
  // const sql = `
  //  insert into "neededItems" ("userId","itemId")
  //  values ${submitString}
  // `;
});

app.post('/api/addToCalendar', (req, res, next) => {
  const { favoritedRecipeId, dayOfWeek } = req.body;
  if (dayOfWeek === null || dayOfWeek === undefined) {
    res.json({ error: 'dayOfweek cannot be empty' });
  }
  const getSql = `
    select "recipeId",
      "userId"
    from "favoritedRecipes"
    where "favoritedRecipeId" = $1;
  `;
  const params1 = [favoritedRecipeId];
  db.query(getSql, params1)
    .then(result => {
      const [recipeInfo] = result.rows;
      const recipeId = recipeInfo.recipeId;
      const userId = recipeInfo.userId;
      const sql = `
        insert into "plannedRecipes" ("userId", "recipeId", "dayOfWeek")
        values ($1, $2, $3)
        returning *
      `;
      const params = [userId, recipeId, dayOfWeek];
      db.query(sql, params)
        .then(result2 => {
          res.json(result2.rows[0]);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

app.post('/api/addNewPlanned', (req, res, next) => {
  const userId = 1;
  const { recipeUri, dayOfWeek } = req.body;
  const sql = `
    insert into "Recipes" ("recipeUri")
    values ($1)
    returning *
  `;
  const params = [recipeUri];
  db.query(sql, params)
    .then(result => {
      const recipeItem = result.rows[0];
      const sql2 = `
        insert into "plannedRecipes" ("userId", "recipeId", "dayOfWeek")
        values ($1, $2, $3)
        returning *
      `;
      const params2 = [userId, recipeItem.recipeId, dayOfWeek];
      db.query(sql2, params2)
        .then(result2 => {
          res.json(result2.rows[0]);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

app.get('/api/planned', (req, res, next) => {
  const userId = 1;
  const sql = `
    select *
    from "plannedRecipes" as "p"
    join "Recipes" using ("recipeId")
    where "p"."userId" = $1;
  `;
  const params = [userId];
  db.query(sql, params)
    .then(result => {
      const items = result.rows;
      res.json(items);
    })
    .catch(err => next(err));
});

app.get('/api/plannedAt/:day', (req, res, next) => {
  const userId = 1;
  const day = req.params.day;
  const sql = `
    select *
    from "plannedRecipes" as "p"
    join "Recipes" using ("recipeId")
    where "p"."userId" = $1
    and "p"."dayOfWeek" = $2
  `;
  const params = [userId, day];

  db.query(sql, params)
    .then(result => {
      const items = result.rows;
      res.json(items);
    })
    .catch(err => next(err));
});

app.delete('/api/plannedAt/:id', (req, res, next) => {
  const userId = 1;
  const id = req.params.id;
  const sql = `
    delete from "plannedRecipes"
      where "userId" = $1
      and "plannedRecipeId" = $2
      returning *
  `;
  const params = [userId, id];

  db.query(sql, params)
    .then(result => {
      res.json(result.rows[0]);
    })
    .catch(err => next(err));
});

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`express server listening on port ${process.env.PORT}`);
});
