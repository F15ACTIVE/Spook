//.keydown--
//.keypress
//.keyup
//39 right
//
//=============================================================================================================================================
//IMPORTANT OBJECTS//==========================================================================================================================
//=============================================================================================================================================
//this class takes care of factors that change a character or objects motion in different terrains/mediums
function medium_property(xavelocityfactor, xtraction, yavelocityfactor, ytraction, decelerationfactor, cycletimefactor, image_location){
  this.avxfactor = xavelocityfactor;//the faster the move, the greater the resistive force you feel
  this.xtraction = xtraction;
  this.avyfactor = yavelocityfactor;
  this.ytraction = ytraction;
  this.dafactor = decelerationfactor;
  this.ctfactor = cycletimefactor;//for time distortions
  this.image = image_location;
}

//object motion in the x direction
function x_motion(d, v, a, p){
  this.d = d;
  this.v = v;
  this.a = a;
  this.p = p;//x final position;
}

//object motion in the y direction
function y_motion(d, v, a, p){
  this.d = d;
  this.v = v;
  this.a = a;
	this.p = p;//y final position;
}

//character parameters
function character(character_name, mass, width, height, xd, xv, xa, xp, yd, yv, ya, yp, x_right_collision, x_left_collision, y_floor_collision, y_ceiling_collision, direction){
  this.name = character_name;
  this.mass = mass;
  //this.frame;
  this.body = $('#'+character_name);
	this.width = width;
	this.height = height;
  this.x = new x_motion(xd, xv, xa, xp);
  this.y = new y_motion(yd, yv, ya, yp);
  this.force = this.mass*this.x.a;
	
	this.x_right_collision = x_right_collision;
	this.x_left_collision = x_left_collision;
	this.y_floor_collision = y_floor_collision;
	this.y_ceiling_collision = y_ceiling_collision;
	
	this.direction = direction;
  
  //movement intervals
  this.move_interval;
}

//world object parameters
function world_physparams(gravity){
  this.gravity = gravity;
}

//occupation zone mapping
function ozone_mapping_params(x, y, w, h, tile_name, tile_terrain){
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
	this.body = $(tile_name);
	this.tile_terrain = tile_terrain;
	this.name = tile_name;
	this.num = tile_name.replace( /^\D+/g, '');
}

//=============================================================================================================================================
//ONLOAD//=====================================================================================================================================
//=============================================================================================================================================
  //initiate the action window
  var page_width = Math.round($(window).width());
	var x_action_min = Math.round(page_width*0.3);
	var x_action_max = Math.round(page_width-(page_width*0.3));
  $('#action_break1').css("left", x_action_min);
  $('#action_break2').css("left", x_action_max);

  var page_height = Math.round($(window).height());
	var y_action_min = Math.round(page_height*0.3);
	var y_action_max = Math.round(page_height-(page_height*0.3));
  $('#action_break3').css("top", y_action_min);
  $('#action_break4').css("top", y_action_max);

	var action_break = 0;
  var master_collision_index = 0;//used so that the collision detection function only determines collisions for tiles that around Spook

  //initiate the keys and ozone array
  var key_down = {'37':null, '38':null, '39':null, '40':null, '16':null, 'jump':null};
  var keydown_count = 0;
	var ozone_array = [];
	
  //terrain values
	//xavelocityfactor: the faster you move, the greater the resistive force you feel
	//xtraction: traction against the ground, multiplied by acceleration for final velocity equation
	//yavelocityfactor
	//ytraction
	//*(not used) decelerationfactor: how quickly you decelerate
	//cycletimefactor: changes cycletime for time distortions
	//image_location
  var dirt = new medium_property(4, 1, 0, 0, 0, 1, "-0px -0px");//4, 1, 1, 1, 15, 1, 
  var ice = new medium_property(0.1, 0.1, 0, 0, 0, 1, "-200px -0px");
  var sludge = new medium_property(10, 0.5, 0, 0, 0, 1, "-400px -0px");
  var final_line = new medium_property(4, 1, 0, 0, 0, 1, "-0px -100px");
	
  //earth's gravity
  var earth = new world_physparams(2000);  

  //world variables
  var terrain = 'dirt';
  var world = 'earth';
  var cycletime_default = 30;
  var cycletime = cycletime_default*window[terrain].ctfactor;

  //create the world
  world_mapping(world, terrain);

  //create the characters
  var spook_xp = $('#spook').offset().left;
  var spook_yp = $('#spook').offset().top;
	var spook = new character('spook', 1, 50, 50, 0, 0, 2000, spook_xp, 0, 0, 800, spook_yp, 0, 0, 0, 0, 1);

$(document).ready(function(){
	
	//fall('spook', 0, world, terrain, direction);

	//$('#stats').text(page_width+' ('+x_action_min+', '+x_action_max+') x '+page_height+' ('+y_action_min+', '+y_action_max+')'); 
	action('spook');

  //Collision Checker
  //=================
  character = 'spook';
  collision_interval = setInterval(function(){
    xposition = window[character].body.offset().left;
    yposition = window[character].body.offset().top;

    //if the character falls below the lowest tile, then reset
    //$("#stats").text(Math.round(bottom_tile_y) + " " + window[character].body.offset().top);
    if (window[character].body.offset().top > bottom_tile_y){
      reset_game("YOU LOST... Reset?");
    }

    collision_detection(character, xposition, yposition);
		//stand(character);
	}, 1);

	//alert();

});

//=============================================================================================================================================
//ACTIONS//====================================================================================================================================
//=============================================================================================================================================
$(document).ready(function(){
  //record key counts and combinations
  //37 - left = walk
  //38 - up = look up
  //39 - right = walk
  //40 - down = look down
  //16 - shift
  //16 + 37/39 = run / swim / dig / push / pull
  //16 + 38/40 = jump / dive / tunnel / lift / drop
  
  //the key that is pressed activates the proper action until another action is activiated
  //for example, if I hit right, Spook will walk right indefinitely
  
  //when I key up, the next action, stop, is engaged, stopping Spook, otherwise, Spook would keep on walking
  
  //if key is down, grab actions for down key
  //if the right/left key is engaged, no keys can pass through
  //(key_down['37'] == null && key_down['38'] == null && key_down['39'] == null && key_down['40'] == null) || (event.which == '16' && key_down[event.which] == null)
  //key_down[event.which] == null
  
  $(document).keydown(function (event){
    if (key_down[event.which] == null){
      //if ((key_down['37'] == null) && (key_down['39'] == null)){
  		key_down[event.which] = true;
      //$('#stats').text(key_down['37']+' '+key_down['38']+' '+key_down['39']+' '+key_down['40']+' '+key_down['16']+' '+key_down['jump']);
      //if we're not jumping, do as normal
  		if (key_down['jump'] == null){action('spook');}
    }
  });
  
  //if key is up, grab actions for up and does not include jump
  $(document).keyup(function(event){
    if (key_down[event.which] == true){
  		key_down[event.which] = null;
      //$('#stats').text(key_down['37']+' '+key_down['38']+' '+key_down['39']+' '+key_down['40']+' '+key_down['16']+' '+key_down['jump']);
      //if we're not jumping, do as normal
  		if (key_down['jump'] == null){action('spook');}
    }	
  });
});  

//this is what action the characters does
function action(character){
  if (key_down['38'] == true && key_down['16'] == true){
		key_down['jump'] = true;
    jump(character, world, terrain);
  }else if (key_down['39'] == true){
  	window[character].direction = 1;
    walk(character, terrain, 'walk');
  }else if (key_down['37'] == true){
  	window[character].direction = -1;
    walk(character, terrain, 'walk');
  }else if (key_down['37'] == null && key_down['38'] == null && key_down['39'] == null && key_down['40'] == null){
    stop(character, world, terrain);
	}
}


//=============================================================================================================================================
//CORE FUNCTIONS//=============================================================================================================================
//=============================================================================================================================================

//this creates the world spook runs through
//it's dependent on the level and contains the array of information needed to pick the right tiles
function world_mapping(world){

	//1 = dirt
	//2 = ice
	
	var tile_name = 'land';
	
	var tile_counter = 0;
	var tile_terrain = [1,    1,  1,  1,  1,  2,    2,    1,    2,    1,    1,    2,    2,    1,    2,    2,    2,    2,    2,    2,    1,    1,    1,    1,    1,    1,    1,    1,    1,    2,    2,    2,    10];
	var tile_posx =    [0,    200,400,600,800,1000, 1200, 1300, 1500, 1700, 2000, 2300, 2500, 2700, 3000, 3050, 3500, 3800, 4000, 4100, 3800, 3600, 3400, 3600, 3800, 4000, 4200, 4500, 4800, 5200, 5300, 5400, 5650];
	var tile_posy =    [500,  500,400,300,200,250,  250,  100,  50,   100,  100,  400,  400,  500,  350,  250,  300, 400,   700,  1000, 1100, 1200, 1500, 1800, 2800, 2900, 3000, 3000, 3000, 3000, 2900, 2800, 2600];
  bottom_tile_y = array_max(tile_posy);

	var tile_countmax = tile_terrain.length;

  while (tile_counter < tile_countmax){
    if (tile_terrain[tile_counter] == 1){
    	tile_terrain_type = 'dirt';
  	}else if(tile_terrain[tile_counter] == 2){
    	tile_terrain_type = 'ice';
    }else if(tile_terrain[tile_counter] == 3){
      tile_terrain_type = 'sludge';
  	}else if(tile_terrain[tile_counter] == 10){
      tile_terrain_type = 'final_line';
    }
  	tile_creator(tile_name, tile_counter, tile_terrain_type, tile_posx[tile_counter], tile_posy[tile_counter]);
		tile_counter = tile_counter + 1;
  }
}

//create a tile
function tile_creator(tile_name, tile_number, tile_terrain, x, y){
  //create it
	var land_tile_element = '<div class="tile '+tile_name+tile_number+'"></div>';
	$(land_tile_element).appendTo('#'+tile_name);

  var land_tile = '#'+tile_name+' .'+tile_name+tile_number;
	//get the image and the appropriate image location
	$(land_tile).css('background', "url('world_"+world+".gif') "+window[tile_terrain].image);

  /*
  if (tile_terrain == "final_line"){
    var final_line_f = 0;
    setInterval(function(){
      if (final_line_f == 0){
        $(land_tile).css('background', "url('world_"+world+".gif') -0px -100px");
        final_line_f = 1;
      }else if (final_line_f == 1){
        $(land_tile).css('background', "url('world_"+world+".gif') -200px -100px");
        final_line_f = 2;
      }else if (final_line_f == 2){
        $(land_tile).css('background', "url('world_"+world+".gif') -400px -100px");
        final_line_f = 0;
      }
    }, 1000);
  }*/

	//position it
	$(land_tile).css('left', x);
	$(land_tile).css('top', y);
	//ozone map it
	ozone_mapping(tile_name, tile_number, x, y, tile_terrain);
}

//destroy a tile
//remove the element and remove its ozone data
function tile_destroyer(tile_name, tile_number){
  $('#'+tile_name+' .'+tile_name+tile_number).remove();
	ozone_array[tile_number] = null;
}

//create the tile's ozone
//you can only collide with land objects/objects that are in your plane, not the background, foreground etc
function ozone_mapping(tile_name, tile_number, x, y, tile_terrain){
  var tile_name2 = '#'+tile_name+' .'+tile_name+tile_number;
	var w = $(tile_name2).width();
	var h = $(tile_name2).height()
  window[tile_name+tile_number] = new ozone_mapping_params(x, y, w, h, tile_name2, tile_terrain);
  ozone_array[tile_number] = window[tile_name+tile_number];
	window.ozone_max = ozone_array.length;
}

//check for collisions with ozones
action_break = null;
function collision_detection(character, character_x, character_y){

  //the ozone_count index will start on the tile Spook is on -5
  var ozone_count = master_collision_index-5;
	if (ozone_count < 0){//if the -5 is less than 0, make the index 0 since index can't be lower than 0
  	ozone_count = 0;
	}
	var ozone_coldec_max = ozone_count+10;//make the limit of the check +10 ahead of ozone_count (or 5 tiles ahead of Spook)//coldec = collisiondetection
	if (ozone_coldec_max > ozone_max){//if the max is higher than the real max, set it to the real max
  	ozone_coldec_max = ozone_max;
	}

  //var stop = 0;
  var character_x = Math.round(character_x);
  var character_xw = Math.round(character_x + window[character].width);
  var character_y = Math.round(character_y);
  var character_yh = Math.round(character_y + window[character].height);
	
	window[character].x_right_collision = 0;
	window[character].x_left_collision = 0;
	window[character].y_floor_collision = 0;
	window[character].y_ceiling_collision = 0;

  var x_left_collision = 0;
  var x_right_collision = 0;
  var y_floor_collision = 0;
  var y_ceiling_collision = 0;

	//if the object hasn't hit the first object, check all subsequent objects
  while (ozone_count < ozone_coldec_max){
  	
    //if the array index that once contained the level element is gone, then skip it
    if (ozone_array[ozone_count] == null){
  		continue;
    }

		var x_buffer = 5;
    var x = Math.round(ozone_array[ozone_count].x);
		var x_min = x - x_buffer;//buffer x values
		var x_max = x + x_buffer;//buffer x values
    var xw = Math.round(x + ozone_array[ozone_count].w);
		var xw_min = xw - x_buffer;//buffer x values
		var xw_max = xw + x_buffer;//buffer x values
		
    //what if the buffer size depended on the speed?
		var y_buffer = 30;
    var y = Math.round(ozone_array[ozone_count].y);
		var y_min = y - y_buffer;//buffer x values
		var y_max = y + y_buffer;//buffer x values
    var yh = Math.round(y +ozone_array[ozone_count].h);
		var yh_min = yh - y_buffer;//buffer x values
		var yh_max = yh + y_buffer;//buffer x values
		
		//check 1: which surface buffer did he hit
		//check 2: is he within the opposite axis zone (if he hit x, was he within the y range?) 
		//check 3: he can only hit one x surface at a time
		//check 4: you can only hit the correct wall in the right direction of velocity
    if ((character_xw >= x_min && character_xw <= x_max) &&
		((character_y > y && character_y < yh) || (character_yh > y && character_yh < yh) || (y > character_y && y < character_yh) || (yh > character_y && yh < character_yh)) && 
		window[character].x_left_collision == 0 &&
		window[character].x.v >= 0){//hit left wall
  		window[character].x.v = 0;
  		window[character].x.p = x - window[character].width - x_buffer;//new position is at wall - 50px ahead of it
			window[character].body.css("left", window[character].x.p);
			window[character].x_left_collision = 1;
    }else	if ((character_x >= xw_min && character_x <= xw_max) && 
		((character_y > y && character_y < yh) || (character_yh > y && character_yh < yh) || (y > character_y && y < character_yh) || (yh > character_y && yh < character_yh)) && 
		window[character].x_right_collision == 0 &&
		window[character].x.v < 0){//hit right wall
  		window[character].x.v = 0;
  		window[character].x.p = xw + x_buffer;//new position is at wall
			window[character].body.css("left", window[character].x.p);
			window[character].x_right_collision = 1;
		}else	if ((character_yh >= y_min && character_yh <= y_max) && 
		((character_x > x && character_x < xw) || (character_xw > x && character_xw < xw) || (x > character_x && x < character_xw) || (xw > character_x && xw < character_xw)) && 
		window[character].y.v >= 0){//hit floor
		
  		//if he lands on a tile, change the terrain to that tile's terrain
			terrain = ozone_array[ozone_count].tile_terrain;
			
			//stop their motion
  		window[character].y.v = 0;
      window[character].y.p = y-window[character].height-x_buffer;
			window[character].body.css("top", window[character].y.p);
			window[character].y_floor_collision = 1;
			
			//cancel jumping
      //key_down['jump'] = null;
			
			//activate stop function
			if (key_down['jump'] == true){
  			key_down['jump'] = null;
  			stop(character, world, terrain);
			}

      //whichever tile Spook is on, make that the master collision index;
      master_collision_index = ozone_array[ozone_count].num;
      //$('#stats').text(master_collision_index);

      //$('#stats').text(character+' '+world+' '+terrain);

      if (ozone_array[ozone_count].tile_terrain == "final_line"){
        reset_game("YOU WON!!! Reset?");
      }

		}else if ((character_y >= yh_min && character_y <= yh_max) && 
		((character_x > x && character_x < xw) || (character_xw > x && character_xw < xw) || (x > character_x && x < character_xw) || (xw > character_x && xw < character_xw)) && 
		window[character].y.v < 0){//hit ceiling
  		window[character].y.v = 0;
      window[character].y.p = yh;//window[character].body.offset().top;
			window[character].body.css("top", window[character].y.p);
			window[character].y_ceiling_collision = 1;
		}  

    ozone_count = ozone_count + 1;
	}
	
	//this creates a buffer so that if Spook is close to hitting border, he's breached the action window
	/*var x_action_min_buffer = x_action_min + 50;
	var x_action_max_buffer = x_action_max - 50;
	var y_action_min_buffer = y_action_min + 50;
	var y_action_max_buffer = y_action_max - 50;*/
	
	if (character_x <= x_action_min && window[character].x.v < 0){
		action_break = 1;//left
	}else if (character_xw >= x_action_max && window[character].x.v >= 0){
		action_break = 2;//right
	}else if (character_y <= y_action_min){
		action_break = 3;//top
	}else if (character_yh >= y_action_max){
		action_break = 4;//bottom
	}else{
  	action_break = 0;
	}
		
}

//level mover
function level_mover(xdisplacement, ydisplacement){
  var ozone_count = 0;
	var tile_name = 'land';

  //adjust the position of the bottom tile
  bottom_tile_y = bottom_tile_y-ydisplacement+5;

  while (ozone_count < ozone_max){
		var xposition = ozone_array[ozone_count].body.offset().left - xdisplacement;//- pushes the level back
		
    if (ydisplacement != 0 && action_break == 3){
  		var yposition = ozone_array[ozone_count].body.offset().top - ydisplacement + 5;//+ pushes the level down
		}else if (ydisplacement != 0 && action_break == 4){
  		var yposition = ozone_array[ozone_count].body.offset().top - ydisplacement - 5;//- pushes the level up
		}else{
  		var yposition = ozone_array[ozone_count].body.offset().top;//+ pushes the level down
		}
		//send the tile creation details to remap the tiles
    ozone_mapping(tile_name, ozone_count, xposition, yposition, ozone_array[ozone_count].tile_terrain);
    //$('#stats').text(ozone_max);

		ozone_array[ozone_count].body.css('left', xposition);
		ozone_array[ozone_count].body.css('top', yposition);
    ozone_count = ozone_count + 1;
	}
			
	//use tile_name to refer to land, background, sky, etc, and move them by smaller values of the x and y displacement values
}

//this stops the character
function stop(character, world, terrain){

  clearInterval(window[character].move_interval);
  //var stop_cycle_count = 1;

  window[character].move_interval = setInterval(function(){
  	//the acceleration is dependent on the speed of character (more speed, more acceleration)
    if (key_down['jump'] == true){
      var a = (window[terrain].avxfactor * window[character].x.v)*-0.5;//x2 for greater stoppage WHEN ON THE GROUND
		}else{
      var a = (window[terrain].avxfactor * window[character].x.v)*-2;//x2 for greater stoppage WHEN ON THE GROUND
		}
		var g = window[world].gravity;
		var a_test = Math.round((a*cycletime/1000)*1000)/1000;//round to 2 decimal places

    //if the acceleration gets VERY small, to the point where it stops decelerating, then make him stop, because he's not moving anymore
		if (a_test == 0){
  		a = 0;
			//stand(character, direction);
		}
		
    //x position (collisions register as 0 velocity)
		window[character].x.v = window[character].x.v + (a * (cycletime/1000));//changing velocity
		xdisplacement = (window[character].x.v*(cycletime/1000)) + (0.5 * a * (cycletime/1000)*(cycletime/1000));//displacement
		xdisplacement = Math.round(xdisplacement);//*1000)/1000;
		if (window[character].x_right_collision == 1 || window[character].x_left_collision == 1){
  		xdisplacement = 0;
		} 
		var xposition = Math.round(window[character].body.offset().left + xdisplacement);
    
    //y position (collisions register as 0 velocity)
		window[character].y.v = window[character].y.v + (g * (cycletime/1000));//changing velocity
    ydisplacement = (window[character].y.v*(cycletime/1000)) + (0.5 * g * (cycletime/1000)*(cycletime/1000));
		ydisplacement = Math.round(ydisplacement);//*1000)/1000;
		if (window[character].y_floor_collision == 1 || window[character].x_ceiling_collision == 1){
  		ydisplacement = 0;
		} 
		var yposition = Math.round(window[character].body.offset().top + ydisplacement);

    //pick the animation frame for the character
    if (window[character].direction == 1 && ydisplacement!=0){
    	window[character].body.css("background-position", "-50px -250px");
			key_down['jump'] = true;
  	}else if (window[character].direction == -1 && ydisplacement!=0){
    	window[character].body.css("background-position", "-100px -250px");
			key_down['jump'] = true;
  	}else if (window[character].direction == 1 && xdisplacement!=0){
    	window[character].body.css("background-position", "-0px -150px");
  	}else if (window[character].direction == -1 && xdisplacement!=0){
    	window[character].body.css("background-position", "-150px -200px");
  	}

		//if the character has broken through the window of action, then move the level and not the character
    if (action_break == 0){
    	window[character].body.css("left", xposition);
    	window[character].body.css("top", yposition);
		}else if (action_break == 1 || action_break == 2){
  		level_mover(xdisplacement, 0);
			window[character].body.css("top", yposition);
		}else if (action_break == 3 || action_break == 4){
			level_mover(0, ydisplacement);
			window[character].body.css("left", xposition);
		}

    //if there are no displacements, then make the character stand there
		if (ydisplacement == 0 && xdisplacement == 0){
  		//clearInterval(window[character].move_interval);
			window[character].x.v = 0;
			window[character].y.v = 0;
  		stand(character);
		}
		
  }, cycletime);
  
}

//this walks/runs the character
function walk(character, terrain, speed){

  clearInterval(window[character].move_interval);

  var a;
	var g = window[world].gravity;
  
  if (speed == 'walk'){
    a = Math.round(window[character].x.a) * window[character].direction;
  }else{
    a = Math.round(window[character].x.a*2) * window[character].direction;
  }

	//clear_all_intervals(character, clearInterval_max);

  //step animation pic
  var f = 1;
	
  //var displacement = window[terrain].vxfactor * window[character].x.v * cycletime/1000 * direction;
	
  window[character].move_interval = setInterval(function(){

  	//vf = vi + at
		//x = vt + 0.5at^2
    window[character].x.v = window[character].x.v + (window[terrain].xtraction*a*cycletime/1000);
  	var xdisplacement = (window[character].x.v * cycletime/1000) + (0.5 * a * (cycletime/1000) * (cycletime/1000));//10*direction;
		var xposition = Math.round(window[character].body.offset().left + xdisplacement);

    //y position (no initial velocity, since the character is falling)
		//window[character].y.v = 0;
		window[character].y.v = window[character].y.v + (g * (cycletime/1000));//changing velocity
    ydisplacement = (window[character].y.v*(cycletime/1000)) + (0.5 * g * (cycletime/1000)*(cycletime/1000));
		var yposition = Math.round(window[character].body.offset().top + ydisplacement);

		//check for collisions
		//====================
		//collision_detection(character, direction, xposition, xposition+window[character].width, yposition, yposition+window[character].height);
		
    //the acceleration of the character against the terrain depends on the speed it's currently at
		a = Math.round(a - (window[terrain].avxfactor * window[character].x.v));

    //if the acceleration of the ground goes below 0 in the +direction or above 0 is the -direction, then stop
		if ((a <= 0 && window[character].direction == 1) || (a >= 0 && window[character].direction == -1)){
  		a = 0;
    }	
		
		if (f == 1){
			f = 2;
      if (window[character].direction == 1){
      	window[character].body.css("background-position", "-0px -50px");
      }else{
      	window[character].body.css("background-position", "-150px -100px");
      }						

		}else if (f == 2){
			f = 3;
      if (window[character].direction == 1){
      	window[character].body.css("background-position", "-50px -50px");
      }else{
      	window[character].body.css("background-position", "-100px -100px");
      }						

		}else if (f == 3){
			f = 4;
      if (window[character].direction == 1){
      	window[character].body.css("background-position", "-100px -50px");
      }else{
      	window[character].body.css("background-position", "-50px -100px");
      }						

		}else if (f == 4){
			f = 1;
      if (window[character].direction == 1){
      	window[character].body.css("background-position", "-150px -50px");
      }else{
      	window[character].body.css("background-position", "-0px -100px");
      }						

  	}

    if (action_break == 0){
    	window[character].body.css("left", xposition);
    	window[character].body.css("top", yposition);
		}else if (action_break == 1 || action_break == 2){
  		level_mover(xdisplacement, 0);
			window[character].body.css("top", yposition);
		}else if (action_break == 3){
			level_mover(0, ydisplacement);
			window[character].body.css("left", xposition);
		}else if (action_break == 4){
			level_mover(0, ydisplacement);
			window[character].body.css("left", xposition);
		}
		

  }, cycletime);
}

//this jumps the character
function jump(character, world, terrain){//spook_y_dspi, spook_y_velavg, spook_x_dspi, spook_x_velavg
  //$('#stats').text(window[character].x.v);
  clearInterval(window[character].move_interval);

	//var yposition_initial = window[character].y.p;//window[character].body.offset().top;
	var g = window[world].gravity;
	
  //give some space between the character and ground to enable jumping (constant collision creates null jump status)
  window[character].body.css("top", window[character].body.offset().top-40);
  window[character].y.v = window[character].y.a * -1;//character's initial velocity is the acceleration x time (1s) x direction (-)
  //var yv_initial = window[character].y.v;//save this initial velocity

  window[character].move_interval = setInterval(function(){

    //x position
    //==========
    //x = vt (no acceleration midair)
  	var xdisplacement = window[character].x.v * cycletime/1000;
		var xposition = Math.round(window[character].body.offset().left + xdisplacement);

    //y position
    //==========
    //y = vt + 0.5at^2
    window[character].y.v = window[character].y.v + (g * cycletime/1000);
    var ydisplacement = (window[character].y.v * (cycletime/1000)) + (0.5 * g * (cycletime/1000)*(cycletime/1000));
		var yposition = Math.round(window[character].body.offset().top + ydisplacement);
	
    //if the character's y displacement is greater than 0, let the stop function take over in stopping the character
		//y displacement is greater than 0 when moving AWAY from the top, sooo, on the way down, call stop
    if (ydisplacement > 0){
  		stop(character, world, terrain);
    }
		
		//pick the animation frame for the character
    if (window[character].y.v > 0 && window[character].direction == 1){
      window[character].body.css("background-position", "-0px -250px");
    }else if (window[character].y.v < 0 && window[character].direction == 1){
      window[character].body.css("background-position", "-50px -250px");
    }else if (window[character].y.v > 0 && window[character].direction == -1){
      window[character].body.css("background-position", "-150px -250px");
    }else if (window[character].y.v < 0 && window[character].direction == -1){
      window[character].body.css("background-position", "-100px -250px");
    }

    //move the character or move the level
    if (action_break == 0){
    	window[character].body.css("left", xposition);
    	window[character].body.css("top", yposition);
		}else if (action_break == 1 || action_break == 2){
  		level_mover(xdisplacement, 0);
			window[character].body.css("top", yposition);
		}else if (action_break == 3 || action_break == 4){
			level_mover(0, ydisplacement);
			window[character].body.css("left", xposition);
		}
		
  }, cycletime);

}

//this is an animation of when the character stands around
function stand(character){

  clearInterval(window[character].move_interval);

	window[character].x.v = 0;
	//clear_all_intervals(character, clearInterval_max);

  //window[] makes the name within a variable name
	var f = 0;
	var animation0 = 50;//random_value(10, 100)
	var animation1 = animation0+random_value(10, 200);
	var animation_choice = random_value(0, 1); 
	
  window[character].move_interval = setInterval(function(){
    f = f+1;

		if (f < animation0){
			//look straight
  			if (window[character].direction == 1){
        	window[character].body.css("background-position", "-0px -150px");
				}else{
        	window[character].body.css("background-position", "-150px -200px");
				}	

		}else if (f >= animation0 && f < animation1){
			if (animation_choice == 0){
  			if (window[character].direction == 1){
        	window[character].body.css("background-position", "-50px -150px");
				}else{
        	window[character].body.css("background-position", "-100px -200px");
				}	
			}else if (f%50 != 0){
  			if (window[character].direction == 1){
        	window[character].body.css("background-position", "-100px -150px");
				}else{
        	window[character].body.css("background-position", "-50px -200px");
				}	
			}else if (f%1 == 0){
  			if (window[character].direction == 1){
        	window[character].body.css("background-position", "-150px -150px");
				}else{
        	window[character].body.css("background-position", "-0px -200px");
				}	
			}

  	}else if (f >= animation1){
  			if (window[character].direction == 1){
        	window[character].body.css("background-position", "-0px -150px");
				}else{
        	window[character].body.css("background-position", "-150px -200px");
				}	
					
			//repeat the cycle
			stand(character);
    }

  }, cycletime);
}

//for impacts on walls and grounds, the character shakes their eyes
function eyeshake(character){
  clearInterval(window[character].move_interval);

	var f = 0;
  window[character].move_interval = setInterval(function(){
    f = f+1;
    if (f%2==0){
      if (window[character].direction == 1){
        	window[character].body.css("background-position", "-0px -300px");
      }else{
        	window[character].body.css("background-position", "-100px -300px");
      }	
    }else{  
      if (window[character].direction == 1){
        	window[character].body.css("background-position", "-50px -300px");
      }else{
        	window[character].body.css("background-position", "-150px -300px");
      }
  	}	

    //after 3 frames just stand
    if (f < 4){
    	stand(character);
    }	

  }, cycletime);
}


//basic functions
//===============
function random_value(minimum, maximum){
  return Math.round(Math.random()*(maximum-minimum+1)+minimum);
}

function array_max(array_to_check){
  max_num = array_to_check[0];
  array_length = array_to_check.length;
  for (var i = 1; i < array_length; ++i){
    if (array_to_check[i] > max_num){
      max_num = array_to_check[i];
    } 
  }
  return max_num;
}

//Reset the game
//==============
function reset_game(status){
  $("#result").css("display", "block");
  $("#result").text(status);
  //location.reload();
}

$("#result").click(function(){
  location.reload();  
});
