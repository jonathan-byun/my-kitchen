import React from 'react';

export default function ShoppingListItem(props) {
  const item = props.foodItem;
  const imgUrl = `./images/${item.foodCategory}.webp`;
  return (
    <div className='width-100 cursor-pointer row my-3 align-center'>
      <div id={item.neededItemId} className='row align-center col h-100 py-4' onClick={props.updateSelected}>
        <div className='col-2'>
          <img className='food-item-img' src={imgUrl}></img>
        </div>
        <div className='food-item-name no-select col-2'>
          {item.name}
        </div>
      </div>
    </div>
  );
}
