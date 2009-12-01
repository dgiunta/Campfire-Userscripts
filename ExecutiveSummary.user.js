// ==UserScript==
// @name        ExecutiveSummary
// @namespace   http://fluidapp.com
// @description Adds the ability to add specific messages to another campfire room, as an Executive Summary of what you're talking about in the current room.
// @include     *
// @author      Dave Giunta
// ==/UserScript==

(function () {
    if (window.fluid) {
      var ExecutiveSummary = function() {
        function init () {
          $$('tr.message').each(attach_to_row);
          create_config();
        };
        
        // Doesn't send the "person" parameter properly, apparently. Not quite sure why.
        // This results in the person speaking the update in the ES room being whoever clicked
        // the "Send to ES" link, and not the original poster.
        // 
        function send_to_es (message, person, options) {
          var room_id = $F('ES_room_id'),
              opts = Object.extend({
                method: "post",
                parameters: {
                  message: message,
                  person: person
                },
                onSuccess: function() {
                  link.remove();
                }
              }, options);
          
          if (room_id !== '') {
            new Ajax.Request("/room/" + room_id + "/speak", opts);
          } else {
            alert('The Executive Summary Room must be set.');
          };
        };
        
        function attach_to_row (row) {
          var link = new Element('a', { href: '#' })
            .setStyle({
              'float': "right", 
              zIndex: '1000', 
              position: 'relative', 
              display: 'none',
              fontSize: '10px',
              padding: '1px 5px',
              margin: '0',
              backgroundColor: '#666',
              color: '#ccc'
            })
            .insert("ES &rarr;")
            .observe('click', function(e) {
              e.stop();
              var message = this.next('div').innerHTML;
              var person = this.up('tr').down('td.person span').innerHTML;
              
              send_to_es(message, person, {
                onSuccess: function() {
                  link.remove();
                }
              });
            });

          function showLink () { link.show(); }
          function hideLink () { link.hide(); }

          var classnames = row.getAttribute('class').split(" ");
          function classnames_dont_include () {
            var exclude = true;
            $A(arguments).each(function(cn) {
              if (classnames.include(cn)) { exclude = false; };
            });
            return exclude;
          }

  		    if (classnames_dont_include("timestamp_message", "enter_message", "kick_message", "paste_message", "advertisement_message")) {
  		      row.observe('mouseover', showLink);
  		      row.observe('mouseout', hideLink);
    		    row.down('td.body').insert({top: link});
  		    };
        };
        
        function create_config () {
    		  var config      = new Element('div', {id: "executive_summary_config"}),
              header      = new Element('h3'),
              form        = new Element('form'),
              id_div      = new Element('div'),
              // message_div = new Element('div', {id: "message_div"}),
              // text_input  = new Element('textarea', {id: "message_text"}),
              input       = new Element('select', {id: "ES_room_id"}),
              label       = "Room: ";
          
          header.innerHTML = "Executive Summary";
          config.insert(header);
          form.setStyle({fontSize: '10px'});
          input.insert(new Element("option", {value: ""}));
          id_div.insert(label);
          id_div.insert(input);
          form.insert(id_div);
          // message_div.insert(text_input);
          // form.insert(message_div);
          config.insert(form);

          $('guest_access').insert({before: config});

          new Ajax.Request('/rooms', {
            contentType: 'text/html',
            requestHeaders: {
              "Accept": "text/xml"
            },
            method: 'get',
            onSuccess: function(response) {
              var xml = response.responseXML,
                  rooms = [],
                  roomxml = xml.getElementsByTagName('room'),
                  current_room_id = window.location.pathname.match(/(\d+)/)[0],
                  i;

              for (i=0; i < roomxml.length; i++) {
                rooms[i] = {
                  id: roomxml[i].getElementsByTagName('id')[0].textContent,
                  name: roomxml[i].getElementsByTagName('name')[0].textContent
                };
              };

              rooms.each(function(room) {
                if (current_room_id != room.id) {
                  var opt = new Element('option', { value: room.id });
                  opt.insert(room.name);
                  input.insert(opt);
                };
                
                if (room.name == "Executive Summary") {
                  opt.setAttribute('selected', 'selected');
                };
              });
            }
          });
  		  };
        
        return {
          init: init, 
          send_to_es: send_to_es,
          attach_to_row: attach_to_row,
          create_config: create_config
        };
      }();
      		  		  
      if (typeof( Campfire.Transcript.prototype.insertMessages_without_es ) == "undefined" ) Campfire.Transcript.prototype.insertMessages_without_es = Campfire.Transcript.prototype.insertMessages;
      Campfire.Transcript.prototype.insertMessages = function() {
        try {
          messages = this.insertMessages_without_es.apply(this, arguments);
          messages.each(function(message) {
            ExecutiveSummary.attach_to_row(message.element);
          });

          return messages;
        } catch(e) {}
      };
            
      ExecutiveSummary.init();
    }
})();