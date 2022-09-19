const storage = browser.storage.local;

const Download_file_name = 'backup.json';
const Div_download = 'downloader';

const Div_table_view = 'table_view';
const Table_view_select_id = 'sort';

const Div_table = 'container';
const Table_id = 'table_id';

/// @brief creates a link to export data from the storage in JSON format
function generate_download_link(bookmarks)
{
     let blob = new Blob([JSON.stringify(bookmarks)]
     , {
          type: 'application/json'
     });
     let url = URL.createObjectURL(blob);
     let a = document.createElement('a');
     a.href = url;
     a.download = Download_file_name;
     a.textContent = 'Download ' + Download_file_name;
     document.getElementById(Div_download)
          .appendChild(a);
}

/// @brief creates a selection for displaying tables
function generate_select()
{
     let label = document.createElement('label');
     label.setAttribute('for', Div_table_view);
     label.innerHTML = 'Table sorted by: ';
     
     let select = document.createElement('select');
     select.setAttribute('id', Table_view_select_id);
     select.add(new Option('Time of adding', 'added'));
     select.add(new Option('URL', 'url'));
     select.add(new Option('Title', 'title'));
     
     let common = document.getElementById(Div_table_view);
     common.appendChild(label);
     common.appendChild(select);
}

/// @brief connects a selection click to a table display
/// @param bookmarks - data that is stored in the storage
function setup_sort_action(bookmarks)
{
     document.getElementById(Div_table_view)
          .addEventListener('change', function ()
          {
               if (!bookmarks)
               {
                    console.warn('storage is empty');
                    return;
               }
               let sort_type = document.getElementById(Table_view_select_id)
                    .value;
               switch (sort_type)
               {
               case 'url':
               case 'title':
               {
                    bookmarks.sort(function (lhs, rhs)
                    {
                         return lhs[sort_type].localeCompare(rhs[sort_type]);
                    });
                    break;
               }
               case 'added':
               {
                    bookmarks.sort(function (lhs, rhs)
                    {
                         
                         return lhs['date'][sort_type].localeCompare(rhs['date'][sort_type]);
                    });
                    
                    break;
               }
               default:
                    console.log('not implemented');
               }
               
               document.getElementById(Table_id)
                    .remove();
               generate_table(bookmarks);
          });
}

/// @brief creates HTML-table by data
/// @param bookmarks - data that is stored in the storage
function generate_table(bookmarks)
{
     let container = document.getElementById(Div_table);
     let table = document.createElement('table');
     table.setAttribute('id', Table_id);
     // creating a table description 
     let caption = document.createElement('caption');
     caption.innerHTML = 'Bookmark storage';
     
     container.appendChild(table);
     table.appendChild(caption);
     
     // creating headers of each columns
     let thead = table.createTHead();
     let row = thead.insertRow();
     for (let str of Object.keys(bookmarks[0]))
     {
          let th = document.createElement('th');
          let text = document.createTextNode(str);
          th.appendChild(text);
          row.appendChild(th);
     }
     
     // creating each row based on the data in the storage
     for (let [index, element] of bookmarks.entries())
     {
          let row = table.insertRow();
          row.setAttribute('id', index); // for removal a row
          for (key in element)
          {
               let cell = row.insertCell();
               cell.setAttribute('id', key);
               let text = document.createTextNode(element[key]);
               switch (key)
               {
               case 'url':
                    // it should be a link
                    let a = document.createElement('a');
                    a.appendChild(text);
                    a.href = element[key];
                    cell.appendChild(a);
                    break;
               case 'date':
                    cell.appendChild(document.createTextNode('Added time: ' + element[key]['added']));
                    if (element[key]['changed'].length !== 0)
                    {
                         cell.appendChild(document.createElement('br'));
                         cell.appendChild(document.createTextNode('Last edit time: ' + element[key]['changed']));
                    }
                    break;
               default:
                    // title, description
                    cell.setAttribute('class', 'editable');
                    cell.appendChild(text);
               }
          }

          // event for edit button
          let buttonEdit = document.createElement('button');
          buttonEdit.type = 'button';
          buttonEdit.innerHTML = 'Edit';
          buttonEdit.onclick = function ()
          {
               if (buttonEdit.innerHTML === 'Edit')
               {
                    buttonEdit.innerHTML = 'Save';
                    for (let text of row.cells)
                    {
                         if (text.className == 'editable')
                         {
                              text.setAttribute('contenteditable', true);
                         }
                    }
                    // set default focus to description
                    row.cells.namedItem('description')
                         .focus();
               }
               else
               {
                    buttonEdit.innerHTML = 'Edit';
                    // the row should not change now
                    row.setAttribute('contenteditable', false);

                    let indexToEdit = bookmarks.findIndex(
                         item => item['url'] === row.cells.namedItem('url')
                         .textContent
                    );
                    
                    if (indexToEdit == -1)
                    {
                         console.error('Bookmark not found');
                         return;
                    }
                    
                    let changed = false;
                    for (let text of row.cells)
                    {
                         if (text.className == 'editable')
                         {
                              let content = text.textContent;
                              if (bookmarks[indexToEdit][text.getAttribute('id')] != content)
                              {
                                   changed = true;
                                   bookmarks[indexToEdit][text.getAttribute('id')] = text.textContent;
                              }
                         }
                    }
                    if (changed)
                    {
                         let editTime = new Date()
                              .toLocaleString();
                         
                         let currentCell = row.cells.namedItem('date');
                         if (bookmarks[indexToEdit]['date']['changed'].length != 0)
                         {
                              currentCell.lastChild.textContent = ('Last edit time: ' + editTime);
                         }
                         else
                         {
                              currentCell.appendChild(document.createElement('br'));
                              currentCell.appendChild(
                                   document.createTextNode('Last edit time: ' + editTime)
                              );
                         }
                         
                         bookmarks[indexToEdit]['date']['changed'] = editTime;
                         
                         storage.set(
                         {
                              bookmarks: bookmarks
                         });
                    }
               }
          };
          
          // event for delete button
          let button = document.createElement('button');
          button.type = 'button';
          button.innerHTML = 'Delete';
          button.onclick = function ()
          {
               const indexToDelete = bookmarks.findIndex(
                    item => item['url'] === element['url']
               );
               if (indexToDelete != -1)
               {
                    row.remove();
                    bookmarks.splice(indexToDelete, 1);
                    storage.set(
                    {
                         bookmarks: bookmarks
                    });
                    if (bookmarks.length === 0)
                    {
                         window.location.reload();
                    }
               }
          };

          let cell = row.insertCell();
          cell.appendChild(buttonEdit);
          cell.appendChild(button);
     }
}

/// @brief generates the page if the storage is empty
function page_setup_ERROR()
{
     let header = document.createElement('h1');
     header.innerHTML = 'Storage is empty';
     document.body.append(header);
}

/// @brief generates the page if the storage is not empty
/// @param bookmarks 
function page_setup_OK( bookmarks )
{
     generate_select( bookmarks );
     generate_download_link( bookmarks );
     generate_table( bookmarks );
     setup_sort_action( bookmarks );
}

storage.get()
     .then(data =>
     {
          if (!data.bookmarks || data.bookmarks.length === 0)
          {
               page_setup_ERROR();
               return;
          }
          page_setup_OK( data.bookmarks );
     });
