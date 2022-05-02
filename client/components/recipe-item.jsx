import React from 'react';

export default class RecipeItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clicked: false
    };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState({
      clicked: !this.state.clicked
    });
  }

  render() {
    const recipe = this.props.recipe.recipe;
    const name = recipe.label;
    const imgUrl = recipe.image;

    const ingredientsList = recipe.ingredients.map(ingredient =>
      <li key={recipe.ingredients.indexOf(ingredient)}>{ingredient.text}</li>
    );

    const ingredients =
      <div>
        <h3 className='d-flex justify-content-center'>
          Ingredients
        </h3>
        <div>
          {ingredientsList}
        </div>
      </div>;

    const macrosWanted = ['CHOCDF', 'CHOLE', 'FAT', 'PROCNT', 'NA'];
    const macrosArray = [];
    for (const value of macrosWanted) {
      macrosArray.push(recipe.totalNutrients[value]);
    }

    const macrosList = macrosArray.map(value =>
      <div key={value.label}>
        {value.label} : {value.quantity / recipe.yield} {value.unit}
      </div>
    );

    const macros =
      <div>
        <h3 className='d-flex justify-content-center'>
          Macros per serving
        </h3>
        Calories : {recipe.calories / recipe.yield}
        {macrosList}
      </div>;

    const url = recipe.url;

    const urlButton =
      <div buttontype='url' className='d-flex justify-content-center'>
        <a className='background-green p-3 rounded-pill cursor-pointer transform-hover-scale-1-2 text-decoration-none fira fw-bolder' href={url} target="_blank" rel="noopener noreferrer">Make it!</a>
      </div>;

    const favoriteButton =
      <div buttontype='favorite' className='d-flex justify-content-center'>
        <a className='background-blue p-3 rounded-pill cursor-pointer transform-hover-scale-1-2 text-decoration-none fira fw-bolder text-black'>Favorite!</a>
      </div>;

    const planButton =
      <div buttontype='plan' className='d-flex justify-content-center'>
        <a className='background-rose py-3 px-4 rounded-pill cursor-pointer transform-hover-scale-1-2 text-decoration-none fira fw-bolder text-white'>Plan!</a>
      </div>;

    const buttonsArray = [urlButton, favoriteButton, planButton];
    const buttonsList = buttonsArray.map(button => {
      return (
        <div key={button.props.buttontype} className='my-2'>
          {button}
        </div>
      );
    });

    const recipeDetailsArray = [ingredients, macros, buttonsList];
    const recipeDetails = recipeDetailsArray.map(detail =>
      <div key={recipeDetailsArray.indexOf(detail)} className='mb-4 p-2'>
        {detail}
      </div>
    );
    return (
      <div>
        <div className='row justify-center'>
          <div className='width-80 d-flex align-center border-radius-2rem mt-1 background-beige'>
            <div className='d-flex align-center h-100 py-4 justify-content-center cursor-pointer' onClick={this.handleClick}>
              <div className='col-md-2'>
                <img className='rounded w-100 h-100' src={imgUrl}></img>
              </div>
              <h1 className='no-select d-flex justify-content-center mx-4 col-md'>
                {name} for {recipe.yield}
              </h1>
            </div>
          </div>
        </div>
        {this.state.clicked &&
          <div className='d-flex justify-content-center'>
            <div className='w-75 background-light-beige border border-top-0 border-secondary p-3'>
              {recipeDetails}
            </div>
          </div>
        }
      </div>
    );
  }
}
