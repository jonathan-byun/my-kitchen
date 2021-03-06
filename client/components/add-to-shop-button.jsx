import React from 'react';

export default class AddToShop extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      quantity: 0,
      measurementUnit: '#',
      foodCategory: 'fruits'
    };
    this.resetState = this.resetState.bind(this);
    this.submitItem = this.submitItem.bind(this);
    this.updateItemDetails = this.updateItemDetails.bind(this);
    this.categoryClicked = this.categoryClicked.bind(this);
    this.updateMeasurementUnit = this.updateMeasurementUnit.bind(this);
  }

  resetState() {
    this.setState({
      name: '',
      quantity: 0,
      measurementUnit: '#',
      foodCategory: 'fruits'
    });
  }

  categoryClicked(e) {
    this.setState({
      foodCategory: e.target.id
    });
  }

  updateItemDetails(e) {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({
      [name]: value
    });
  }

  updateMeasurementUnit(e) {
    this.setState({
      measurementUnit: e.target.name
    });
  }

  submitItem() {
    const newItemRequest = {
      name: this.state.name,
      measurementUnit: this.state.measurementUnit,
      foodCategory: this.state.foodCategory
    };
    fetch('/api/newNeededItem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItemRequest)
    })
      .then(res => {
        res.json();
        this.props.showAllItems();
      })
      .catch(err => console.error(err));
  }

  render() {
    const images = (['fruits', 'veggies', 'meat', 'freezer', 'shaker', 'other']);
    const listItems = images.map(image => this.state.foodCategory === image
      ? <div key={image} className='col-md-3  mx-2 '>
        <img id={image} className='add-category-button cursor-pointer border-blue w-75' src={`./images/${image}.png`} onClick={this.categoryClicked} />
      </div>
      : <div key={image} className='col-md-3  mx-2'>
        <img id={image} className='add-category-button cursor-pointer w-75 p-1' src={`./images/${image}.png`} onClick={this.categoryClicked} />
      </div>
    );
    let goodToSubmit = true;
    if (this.state.name === '') {
      goodToSubmit = false;
    }
    return (
      <div className='col-md-1'>
        <a className='add-button cursor-pointer text-align-center' data-bs-toggle="modal" data-bs-target="#addToShoppingListModal" onClick={this.resetState}>Add</a>
        <div className="modal fade" id="addToShoppingListModal" tabIndex="-1" aria-labelledby="addToShoppingListModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="addToShoppingListModalLabel">Needed Item</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body row align-center justify-center">
                <input type="text" value={this.state.name} className="form-control"
                  placeholder="Item name" aria-label="Item name" aria-describedby="basic-addon1" name="name" onChange={this.updateItemDetails} />

                <div className='d-flex flex-wrap justify-center'>
                  {listItems}
                </div>
              </div>
              <div className="modal-footer d-flex justify-between">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                {goodToSubmit
                  ? <button type="button" className="btn btn-primary" data-bs-dismiss='modal' onClick={this.submitItem} >Add</button>
                  : <button type="button" className="btn btn-primary">Add</button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
