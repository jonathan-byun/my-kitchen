import React from 'react';

export default class FoodItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.name,
      quantity: parseInt(props.quantity),
      checked: false,
      category: props.category,
      measurement: props.measurement
    };
    this.toggleChecked = this.toggleChecked.bind(this);
    this.changeQuantity = this.changeQuantity.bind(this);
  }

  toggleChecked(e) {
    this.setState({
      checked: !this.state.checked
    });
    this.props.showSelection();
  }

  changeQuantity(e) {
    if (e.target.id === 'plus-button' || e.target.className === 'fas fa-plus fa-xl') {
      this.setState({
        quantity: this.state.quantity + 1
      });
    } else if (this.state.quantity > 0) {
      this.setState({
        quantity: this.state.quantity - 1
      });
    }
  }

  render() {
    const imgUrl = `./images/${this.state.category}.png`;
    let containerDivClass = 'width-80 row align-center border-radius-2rem margin-1rem justify-between';
    this.state.checked ? (containerDivClass += ' background-light-beige border-solid border-color-green') : (containerDivClass += ' background-beige');
    return (
      <div className={containerDivClass}>
        <div className='width-100' onClick={this.toggleChecked}>
          <div className='row align-center padding-1rem'>
            <div >
              <img className='food-item-img' src={imgUrl}></img>
            </div>
            <div className='food-item-name no-select'>
              {this.state.name}
            </div>
          </div>

        </div>
        <div id='item-quantity-box' className='row align-center padding-1rem'>
          <div id='minus-button' className='plus-minus-icon-holder cursor-pointer' onClick={this.changeQuantity}>
            <i className="fas fa-minus fa-xl"></i>
          </div>
          <div className='food-item-quantity fira'>
            {this.state.quantity}
            {this.state.measurement}
          </div>
          <div id='plus-button' className='plus-minus-icon-holder cursor-pointer' onClick={this.changeQuantity}>
            <i className="fas fa-plus fa-xl"></i>
          </div>
        </div>

      </div>
    );
  }
}