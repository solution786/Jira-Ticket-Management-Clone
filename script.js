let addBtn = document.querySelector(".add-btn");
let removeBtn = document.querySelector(".remove-btn");
let modalCont = document.querySelector(".modal-cont");
let textAreaCont = document.querySelector(".textarea-cont");
let mainCont = document.querySelector(".main-cont");
let allPriorityColors = document.querySelectorAll(".priority-color");
let toolboxColors = document.querySelectorAll(".color");

let colors = ["lightpink", "lightblue", "lightgreen", "black"];
let modalPriorityColor = colors[colors.length - 1];

let addFlag = false;
let removeFlag = false;

let lockClass = "bi-lock";
let unlockClass = "bi-unlock";

let ticketsArray = [];

if (localStorage.getItem("jira_tickets")) {
  // retrieve and display ticktes
  ticketsArray = JSON.parse(localStorage.getItem("jira_tickets"));
  ticketsArray.forEach((ticketObj) => {
    createTicket(ticketObj.ticketColor, ticketObj.ticketTask, ticketObj.ticketId);
  })
}

alert(`
    Instructions:

    Add Task: Enter task details with priority color and press "Esc" key.
    Remove Task: First click on "X" button then click on ticket. (Don't forget to disable "X" button)
    Filter: You can get filtered result by single click on colors present at color box.
    If you double click on any color then we will get all tickets in the result.

`)

for (let i = 0; i < toolboxColors.length; i++) {
  toolboxColors[i].addEventListener("click", (e) => {
    let currentToolBoxColor = toolboxColors[i].classList[0];
    let filteredTickets = ticketsArray.filter((ticketObj, idx) => {
      return ticketObj.ticketColor === currentToolBoxColor;
    });

    // Removes Previous Tickets
    let allTicketsCont = document.querySelectorAll(".ticket-cont");
    for (let i = 0; i < allTicketsCont.length; i++) {
      allTicketsCont[i].remove();
    }

    // Display new filtered tickets
    filteredTickets.forEach((ticketObj, idx) => {
      createTicket(
        ticketObj.ticketColor,
        ticketObj.ticketTask,
        ticketObj.ticketId
      );
    });
  });

  toolboxColors[i].addEventListener("dblclick", (e) => {
    let allTicketsCont = document.querySelectorAll(".ticket-cont");
    for (let i = 0; i < allTicketsCont.length; i++) {
      allTicketsCont[i].remove();
    }

    console.log(ticketsArray)
    ticketsArray.forEach((ticketObj, idx) => {
      createTicket(
        ticketObj.ticketColor,
        ticketObj.ticketTask,
        ticketObj.ticketId
      );
    });
  });
}

// listener for modal priority coloring
allPriorityColors.forEach((colorEle, idx) => {
  colorEle.addEventListener("click", (e) => {
    allPriorityColors.forEach((priorityColorEle, idx) => {
      priorityColorEle.classList.remove("border");
    });
    colorEle.classList.add("border");

    modalPriorityColor = colorEle.classList[0];
  });
});

addBtn.addEventListener("click", (e) => {
  // Display Modal
  // Generate ticket
  // AddFlag -> true -> modal display
  // AddFlag -> false -> modal none
  addFlag = !addFlag;
  if (addFlag) {
    modalCont.style.display = "flex";
  } else {
    modalCont.style.display = "none";
  }
});

removeBtn.addEventListener("click", (e) => {
  removeFlag = !removeFlag;
});

modalCont.addEventListener("keydown", (e) => {
  let key = e.key;
  if (key === "Escape") {
    createTicket(modalPriorityColor, textAreaCont.value, shortid());
    addFlag = false;
    setModalToDefault();
  }
});

function createTicket(ticketColor, ticketTask, ticketId) {
  let id = ticketId || shortid();
  let ticketCont = document.createElement("div");
  ticketCont.setAttribute("class", "ticket-cont");
  ticketCont.innerHTML = `
        <div class="ticket-color ${ticketColor}"></div>
        <div class="ticket-id">#${id}</div>
        <div class="task-area">
        ${ticketTask}
        </div>
        <div class="ticket-lock"> 
             <i class="bi bi-lock"></i>
        </div>

    `;
  mainCont.appendChild(ticketCont);
  let flag = false;
  ticketsArray.forEach((ticketObj) => {
    if (ticketObj.ticketId === id) {
      flag = true;
    }
  });

  if (flag == false) {
    ticketsArray.push({ ticketColor, ticketTask, ticketId: id });
    localStorage.setItem("jira_tickets", JSON.stringify(ticketsArray))
  }

  handleRemoval(ticketCont, id);
  handleLock(ticketCont, id);
  handleColor(ticketCont, id);
}

function handleRemoval(ticket, id) {
  // removeFlag -> true -> remove
  ticket.addEventListener("click", (e) => {
      if (!removeFlag) return;
      let idx = getTicketIdx(id);
      // Db removal 
      ticketsArray.splice(idx, 1);
      let stringTicketsArr = JSON.stringify(ticketsArray);
      localStorage.setItem("jira_tickets", stringTicketsArr);
      ticket.remove();  // UI removal

  })
}

function handleLock(ticket, id) {
  let ticketLockElem = ticket.querySelector(".ticket-lock");
  let ticketLock = ticketLockElem.children[0];
  let ticketTaskArea = ticket.querySelector(".task-area");
  ticketLock.addEventListener("click", (e) => {
    let ticketIdx = getTicketIdx(id);
    if (ticketLock.classList.contains(lockClass)) {
      ticketLock.classList.remove(lockClass);
      ticketLock.classList.add(unlockClass);
      ticketTaskArea.setAttribute("contenteditable", "true");
    } else {
      ticketLock.classList.remove(unlockClass);
      ticketLock.classList.add(lockClass);
      ticketTaskArea.setAttribute("contenteditable", "false");
    }

    // Modify data in local storage (Ticket Task)
    ticketsArray[ticketIdx].ticketTask = ticketTaskArea.innerText;
    localStorage.setItem("jira_tickets", JSON.stringify(ticketsArray));
  });
}

function handleColor(ticket, id) {
  let ticketColor = ticket.querySelector(".ticket-color");

  ticketColor.addEventListener("click", (e) => {
    // get Ticket index from ticketsArray
    let ticketIdx = getTicketIdx(id);
    let currentTicketColor = ticketColor.classList[1];
    // Get ticket color index
    let currentTicketColorIdx = colors.findIndex((color) => {
      return currentTicketColor === color;
    });

    let newTicketColorIdx = (currentTicketColorIdx + 1) % colors.length;

    let newTicketColor = colors[newTicketColorIdx];

    ticketColor.classList.remove(currentTicketColor);
    ticketColor.classList.add(newTicketColor);

    // Modify data in local storage (Priority color change)
    ticketsArray[ticketIdx].ticketColor = newTicketColor;
    localStorage.setItem("jira_tickets", JSON.stringify(ticketsArray));
  });
}

function getTicketIdx(id) {
  let ticketIdx = ticketsArray.findIndex((ticketObj) => {
      return ticketObj.ticketId === id;
  })

  return ticketIdx;
}

function setModalToDefault() {
  modalCont.style.display = "none";
  textAreaCont.value = "";
  modalPriorityColor = colors[colors.length - 1];
  allPriorityColors.forEach((priorityColorEle, idx) => {
    priorityColorEle.classList.remove("border");
  });

  allPriorityColors[allPriorityColors.length - 1].classList.add("border");
}
