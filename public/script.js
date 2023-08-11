
class PresentationController {
    constructor() {

        this.videoElem = document.querySelector("video");
        this.videoElem.style.display = "none";
        this.canvas = document.querySelector("#cameraFeed");


        this.ctx = this.canvas.getContext('2d');
        this.colorToDrawWith = "red";


        this.annotationIndexState = 0;

        this.camera = new Camera(this.videoElem,

            {
                onFrame: async () => {
                    await this.hands.send({ image: this.videoElem });
                },
                width: 1280,
                height: 720
            });
        this.camera.start();

        this.scalingFactor = 2;


        this.selectedIndex = 0;




        this.initHandsModel();




        requestAnimationFrame(this.render.bind(this))
        this.updateSelectedIndex();

    }

    updateSelectedIndex() {
        console.log("update selected index")
        document.querySelectorAll("li").forEach((elem, index) => {
            console.log(this.selectedIndex)
            console.log(elem)

            if (index == this.selectedIndex) {
                elem.classList.add("selected-expense")
            } else {
                elem.classList.remove("selected-expense")
            }

        });

        // console.log(document.querySelectorAll("#list"))

        // this.mylist.forEach((elem, index) => {
        //     console.log("UPDATED");
        //     if (index == this.selectedIndex) {
        //         elem.classList.add("selected-expense")
        //     } else {
        //         elem.classList.remove("selected-expense")
        //     }
        // })
    }

    deleteSelectedIndex() {
        document.querySelectorAll("li").forEach((elem, index) => {
            if (index == this.selectedIndex) {
                console.log("transaction was called")
                removeTransaction(elem.getAttribute("transaction_id"));
            }
        });
    };


    // function to increment the updated index if it's greater than 5 it reverts back to 0
    incrementSelectedIndex() {
        console.log(this.selectedIndex + 1 > document.querySelectorAll("li").length)
        if (this.selectedIndex + 1 > document.querySelectorAll("li").length - 1) {
            this.selectedIndex = 0;
        } else {
            this.selectedIndex++;
        }
        this.updateSelectedIndex();
    }


    initPresentationScreen() {


        this.presentationScreen.width = this.slideDimensions.width;
        this.presentationScreen.height = this.slideDimensions.height;


    }

    currentSlide = {
        value: 0,
        deltaChange: Date.now(),
        incrementSlide: () => {
            console.log(Date.now() - this.currentSlide.deltaChange);
            if (Date.now() - this.currentSlide.deltaChange > 1220) {
                if (this.currentSlide.value + 1 > this.slidesToPresent.length - 1) {
                    return;
                }
                if (!this.drawingState.aInternal) {
                    this.currentSlide.value++;
                    this.currentSlide.deltaChange = Date.now();
                    this.pointsToDraw = []
                }

            }


        },
        decrementSlide: () => {
            if (Date.now() - this.currentSlide.deltaChange > 1220) {
                if (this.currentSlide.value - 1 < 0) {
                    return;
                }
                if (!this.drawingState.aInternal) {

                    this.currentSlide.value--;
                    this.currentSlide.deltaChange = Date.now();
                    this.pointsToDraw = []

                }

            }

        }
    }


    initHandsModel() {


        this.hands = new Hands({

            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }

        })


        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        })

        this.hands.onResults((results) => {
            this.onResultHands(results, this.ctx, this.canvas)
        })


    }

    isDrawing = false;


    pointsToDraw = []




    /**
     * Here true means up false means the finger is down
     */
    fingersStatus = {
        index: true,
        middle: true,
        ring: true,
        pinky: true,
        thumb: true

    }

    checkForFingersStatus(landmarks) {
        this.fingersStatus.index = landmarks[8].y < landmarks[6].y;
        this.fingersStatus.middle = landmarks[12].y < landmarks[10].y;
        this.fingersStatus.ring = landmarks[16].y < landmarks[14].y;
        this.fingersStatus.pinky = landmarks[20].y < landmarks[18].y;
        this.fingersStatus.thumb = landmarks[5].x > landmarks[4].x;

        // console.log(this.fingersStatus);

    }


    pointerLastTick = Date.now();

    deleteLastTick = Date.now();



    /**
     * 
     * 
     * Annotations = 
     * 
     * [
     *    [
     *          [x1, y1]
     *          [x2, y2]
     *    ]
     * 
     *    [
     *          [x1, y1]
     *          [x2, y2]
     *    ]
     *  
     * ]
     * 
     */


    drawingState = {
        aInternal: false,
        change: (val) => {
            if (this.drawingState.aInternal !== val) {
                this.drawingState.aInternal = val;
                this.annotationIndexState++;
            }
        }
    }

    imageToDraw = {
        value: undefined,
        lastTick: Date.now(),
        setTheValue: () => {
            if (Date.now() - this.imageToDraw.lastTick > 1220) {
                let image = new Image();
                image.crossOrigin = "anonymous"
                image.src = this.presentationScreen.toDataURL();;

                this.imageToDraw.value = image;

                this.pointsToDraw = [];
                console.log('save');
                this.imageToDraw.lastTick = Date.now();
            }

        }
    }


    pointerLocation = {
        x: 0,
        y: 0,
        changeXValue: (val) => {
            let speed = val - this.pointerLocation.x;

            if (Math.abs(speed) > 100) {
                if (speed < 0) {
                    console.log("slide next");
                    this.deleteSelectedIndex();
                }

            }

            this.pointerLocation.x = val;


        },
        changeYValue: (val) => {


            let speed = val - this.pointerLocation.y;


            if (Math.abs(speed) > 20) {

                if (speed > 0) {
                    console.log("slide down");
                    this.incrementSelectedIndex();

                }
            }

            this.pointerLocation.y = val;

        }
    }




    onResultHands(resultsLandmarks, ctx, canvasElement) {
        // console.log(resultsLandmarks)
        try {

            ctx.save();
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            ctx.drawImage(
                resultsLandmarks.image, 0, 0, canvasElement.width, canvasElement.height);
            if (resultsLandmarks.multiHandLandmarks) {
                for (const landmarks of resultsLandmarks.multiHandLandmarks) {
                    drawConnectors(ctx, landmarks, HAND_CONNECTIONS,
                        { color: '#00FF00', lineWidth: 5 });
                    drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2 });
                }
            }
            if (resultsLandmarks.multiHandLandmarks != []) {


                let landMarksConverted = resultsLandmarks.multiHandLandmarks[0].map((elem) => {
                    return { x: elem.x * 1000, y: elem.y * 1000 }
                })


                if (Date.now() - this.pointerLastTick > 300) {

                    if (this.fingersStatus.index == true &&
                        this.fingersStatus.middle == false &&
                        this.fingersStatus.ring == false &&
                        this.fingersStatus.pinky == false &&
                        this.fingersStatus.thumb == false) {


                        this.pointerLocation.changeYValue(landMarksConverted[8].y * this.scalingFactor);


                    }

                    if (this.fingersStatus.index == true &&
                        this.fingersStatus.middle == true &&
                        this.fingersStatus.ring == false &&
                        this.fingersStatus.pinky == false &&
                        this.fingersStatus.thumb == false) {

                        // this.drawingState.change(false)
                        if (Date.now() - this.deleteLastTick > 600) {
                            this.pointerLocation.changeXValue(landMarksConverted[8].x * this.scalingFactor);
                            this.deleteLastTick = Date.now();
                        }


                    }

                    this.pointerLastTick = Date.now();
                }

                if (this.fingersStatus.index == false &&
                    this.fingersStatus.middle == false &&
                    this.fingersStatus.ring == false &&
                    this.fingersStatus.pinky == false &&
                    this.fingersStatus.thumb == false) {
                    // console.log("DOWNLOAD THE SLIDE");
                }

                this.checkForFingersStatus(landMarksConverted);


            }



        } catch (e) {
        }



    }


    handleCameraFeed = (stream) => {
        this.videoElem.srcObject = stream
    }





    update() {


        // this.imageToDraw.setTheValue();


    }



    lastTick = Date.now();


    render(ts) {
        this.canvas.width = this.videoElem.videoWidth;
        this.canvas.height = this.videoElem.videoHeight;
        document.querySelector("#cameraFeed").style.right = document.querySelector("#cameraFeed").getBoundingClientRect().width + "px";

        this.ctx.drawImage(this.videoElem, 0, 0)



        // if (this.pointsToDraw.length != 0) {
        //     this.ctx.beginPath();
        //     this.ctx.moveTo(this.pointsToDraw.x, this.pointsToDraw.y)
        //     this.pointsToDraw.forEach(elem => {
        //         this.ctx.lineTo(elem.x, elem.y);
        //         this.ctx.stroke();
        //     })
        // }



        if (Date.now() - this.lastTick > 2) {
            this.update();
            this.lastTick = Date.now();

        }


        // this.renderPresentationScreen()


        requestAnimationFrame(this.render.bind(this));
    }




}


window.onload = () => {

    window.presentationController = new PresentationController();

}





const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const average_expense = document.getElementById('average_expense');
const average_income = document.getElementById('average_income');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');


const localStorageTransactions = JSON.parse(
    localStorage.getItem('transactions')
);

let transactions =
    localStorage.getItem('transactions') !== null ? localStorageTransactions : [];


let user = localStorage.getItem("username");

if (user == null) {
    document.querySelector(".expenseTracker").style.display = "none";
}

const usernameInput = document.querySelector('.username');

usernameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const username = usernameInput.value;
        localStorage.username = username;
        console.log(`localStorage.username has been updated to: ${localStorage.username}`);
        location.reload();

    }
});

if (user != null) {
    usernameInput.value = user;
    fetch('http://localhost:3000/items/user/' + user)
        .then(response => response.json())
        .then(data => {
            const transaction = data;
            localStorage.setItem('transactions', JSON.stringify(transaction));
            console.log('localStorage.transaction has been set.');
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}
// Add transaction
function addTransaction(e) {
    e.preventDefault();

    var words = text.value.trim().split(/\s+/); // Splitting the text into an array of words
    var characterLimit = 10; // Set your desired character limit

    if (words.length > characterLimit) {
        alert("Text is too long. Please make it shorter.");
        return;
    }

    if (parseInt(amount.value.trim()) > 1000000000) {
        alert("Amount is too large. Please make it smaller.");
        return;
    }

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a text and amount');
    } else {
        const transaction = {
            id: generateID(),
            text: text.value,
            amount: +amount.value
        };



        transactions.push(transaction);

        addTransactionDOM(transaction);
        const newItem = {
            id: transaction.id,
            text: transaction.text,
            amount: transaction.amount,
            user: user
        };

        $.ajax({
            url: 'http://localhost:3000/items',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(newItem),
            success: function (data) {
                console.log(data.message);
                updateValues();

                updateLocalStorage();
        
                text.value = '';
                amount.value = '';
            },
            error: function (error) {
                console.error('Error adding item:', error);
            }
        });

    
    }
}

// Generate random ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Add transactions to DOM list
function addTransactionDOM(transaction) {
    // Get sign
    const sign = transaction.amount < 0 ? '-' : '+';

    const item = document.createElement('li');


    item.setAttribute("transaction_id", transaction.id);

    // Add class based on value
    item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

    item.innerHTML = `
    ${transaction.text} <span>${sign}${Math.abs(
        transaction.amount
    )}</span> <button class="delete-btn" onclick="removeTransaction(${transaction.id
        })">x</button>
  `;

    list.appendChild(item);
}

// Create a global variable to hold the chart instance
let lineChart;

// Function to update the chart with new data
function updateChart(newData) {
    // Update the data object
    lineChart.data.datasets[0].data = JSON.parse(
        localStorage.getItem('transactions')
    ).map(el=>el.amount);

    lineChart.data.labels = JSON.parse(
        localStorage.getItem('transactions')
    ).map(el=>el.text);

    // Refresh the chart
    lineChart.update();
}

// Initialize the chart
function initChart() {
    const canvas = document.getElementById('linePlotCanvas');
    const ctx = canvas.getContext('2d');

    const data = {
        labels: transactions.map(elem => elem.text),
        datasets: [{
            label: 'Expense History',
            data: transactions.map(elem => elem.amount),
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.5,

        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    lineChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}

// Call the initialization function
initChart();


// Update the balance, income and expense
function updateValues() {
    
    const amounts = transactions.map(transaction => transaction.amount);

    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);

    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0)
        .toFixed(2);

    const expense = (
        amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) *
        -1
    ).toFixed(2);

    const average_expense_val = (expense / transactions.length).toFixed(2);
    const average_income_val = (income / transactions.length).toFixed(2);


    balance.innerText = `₹${total}`;
    money_plus.innerText = `₹${income}`;
    money_minus.innerText = `₹${expense}`;
    average_expense.innerText = average_expense_val == "NaN" ? "₹0" : `₹${average_expense_val}`;
    average_income.innerText = average_income_val == "NaN" ? "₹0" : `₹${average_income_val}`;



    updateChart(localStorageTransactions.map(elem => elem.amount));

}

// Remove transaction by ID
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== parseInt(id));
    console.log(transactions)
    $.ajax({
        url: 'http://localhost:3000/items/' + id,
        type: 'DELETE',
        success: function (data) {
            console.log(data.message);
            updateLocalStorage();

            init();
        },
        error: function (error) {
            console.error('Error deleting item:', error);
        }
    });



}

// Update local storage transactions
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Init app
function init() {
    list.innerHTML = '';

    transactions.forEach(addTransactionDOM);
    updateValues();
}

init();

form.addEventListener('submit', addTransaction);