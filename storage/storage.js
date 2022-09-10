const storage = browser.storage.local;

const Download_file_name = 'backup.json';
const Div_download = 'downloader';

const Div_table_view = 'table_view';
const Table_view_select_id = 'sort';

const Div_table = 'container';
const Table_id = 'uniq';


/*
@todo: format all files + add comment
     + changes in css
*/
 

// generate a link to export storage
function generate_download_link(bookmarks)
{
     var blob = new Blob([JSON.stringify(bookmarks)],
     {
          type: 'application/json'
     });
     var url = URL.createObjectURL(blob);
     var a = document.createElement('a');
     a.href = url;
     a.download = Download_file_name;
     a.textContent = 'Download ' + Download_file_name;
     document.getElementById(Div_download).appendChild(a);
}

// generate a table view
function generate_select(bookmarks)
{
     var label = document.createElement('label');
     label.setAttribute('for', Div_table_view);
     label.innerHTML = 'Table sorted by: ';
     var previous;

     var select = document.createElement('select');
     select.setAttribute('id', Table_view_select_id);
     select.add(new Option('By time added', 'added'));
     select.add(new Option('URL', 'url'));
     select.add(new Option('Title', 'title'));

     let common = document.getElementById(Div_table_view);
     common.appendChild(label);
     common.appendChild(select);
}

function popup_setup_accept(bookmarks)
{
     document.getElementById(Div_table_view).addEventListener('change', function()
     {
          if (!bookmarks)
          {
               console.warn('storage is empty');
               return;
          }
          let sort_type = document.getElementById(Table_view_select_id).value;
          switch (sort_type)
          {
               case 'url':
               case 'title':
               {
                    bookmarks.sort(function(lhs, rhs)
                    {
                         return lhs[sort_type].localeCompare(rhs[sort_type]);
                    });
                    break;
               }
               case 'added':
               {
                    bookmarks.sort(function(lhs, rhs)
                    {

                         return lhs['date'][sort_type].localeCompare(rhs['date'][sort_type]);
                    });

                    break;
               }
               default:
                    console.log('not implemented');
          }

          document.getElementById(Table_id).remove();
          generate_table(bookmarks);
     });
}

function generate_table(bookmarks)
{
     let container = document.getElementById(Div_table);
     let table = document.createElement('table');
     table.setAttribute('id', Table_id);
     let caption = document.createElement('caption');
     caption.innerHTML = 'Bookmark storage';

     container.appendChild(table);
     table.appendChild(caption);

     let thead = table.createTHead();
     let row = thead.insertRow();
     for (let str of Object.keys(bookmarks[0]))
     {
          let th = document.createElement('th');
          let text = document.createTextNode(str);
          th.appendChild(text);
          row.appendChild(th);
     }

     for (let [index, element] of bookmarks.entries())
     {
          let row = table.insertRow();
          row.setAttribute('id', index);
          for (key in element)
          {
               let cell = row.insertCell();
               cell.setAttribute('id', key);
               let text = document.createTextNode(element[key]);
               switch (key)
               {
                    case 'url':
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
                         cell.setAttribute('class', 'editable');
                         cell.appendChild(text);
               }
          }
          let buttonEdit = document.createElement('button');
          buttonEdit.type = 'button';
          buttonEdit.innerHTML = 'Edit';
          buttonEdit.onclick = function()
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
                    row.cells.namedItem('description').focus();
               }
               else
               {
                    buttonEdit.innerHTML = 'Edit';
                    row.setAttribute('contenteditable', false);
                    storage.get()
                         .then(data =>
                         {
                              var indexToEdit = bookmarks.findIndex(
                                             item => item['url'] === row.cells.namedItem('url').textContent
                              );

                              if (indexToEdit == -1)
                              {
                                   console.error('Bookmark not found');
                                   return;
                              }
                              
                              var changed = false;
                              for (let text of row.cells)
                              {
                                   if (text.className == 'editable')
                                   {
                                        let content = text.textContent;
                                        if ( bookmarks[indexToEdit][text.getAttribute('id')] != content )
                                        {
                                             changed = true;
                                             bookmarks[indexToEdit][text.getAttribute('id')] = text.textContent;
                                        }
                                   }
                              }
                              if ( changed )
                              {
                                   bookmarks[indexToEdit]['date']['changed'] = new Date().toLocaleString();
                                   storage.set(
                                        {
                                             bookmarks: bookmarks
                                        });
                              }
                         });
               }
          };

          // button for delete 
          let button = document.createElement('button');
          button.type = 'button';
          button.innerHTML = 'Delete';
          button.onclick = function()
          {
               storage.get()
                    .then(data =>
                    {
                         const indexToDelete = bookmarks.findIndex(
                              item => item['url'] === element['url']
                         );

                         if (indexToDelete != -1)
                         {
                              bookmarks.splice(indexToDelete, 1);
                              storage.set(
                              {
                                   bookmarks: bookmarks
                              });
                              document.getElementById(index)
                                   .remove();
                              if (bookmarks.length === 0)
                              {
                                   window.location.reload();
                              }
                         }
                    });
          };
          let cell = row.insertCell();
          cell.appendChild(buttonEdit);
          cell.appendChild(button);
     }
}

function popup_setup_error()
{
     let header = document.createElement('h1');
     header.innerHTML = 'Storage is empty';
     document.body.append(header);
}

storage.get()
     .then(data =>
     {
          if (!data.bookmarks || data.bookmarks.length === 0)
          {
               popup_setup_error();
               return;
          }
          generate_select(data.bookmarks);
          generate_download_link(data.bookmarks);
          generate_table(data.bookmarks);
          popup_setup_accept(data.bookmarks);
     });

